class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static FromObject(obj: any): Vector3 {
        if ("x" in obj && "y" in obj && "z" in obj)
            return new Vector3(obj.x, obj.y, obj.z);
        throw new Error("Invalid object");
    }
    static Zero(): Vector3 {
        return new Vector3(0, 0, 0);
    }
    static One(): Vector3 {
        return new Vector3(1, 1, 1);
    }
    DistanceTo = (other: Vector3): number => Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2) + Math.pow(other.z - this.z, 2));
}
class CarWash {
    Location: Vector3;
    Heading: number;
    Length: number;
    private _isOccupied: boolean = false;
    private player: number = -1;
    constructor(_location: Vector3, _heading: number, _length: number) {
        this.Location = _location;
        this.Heading = _heading;
        this.Length = _length;
    }
}

class Marker {
    handle: number = -1;
    private _enabled: boolean = true;
    private destroyed: boolean = false;
    private _markerType: number;
    private _alpha: number = 80;
    private _pos: Vector3 = Vector3.Zero();
    private _offset: Vector3 = Vector3.Zero();
    private _rot: Vector3 = Vector3.Zero();
    private _size: Vector3 = Vector3.One();
    private _R: number = 3;
    private _G: number = 128;
    private _B: number = 252;
    private _bobUpAndDown: boolean = false;
    private _rotate: boolean = false;
    private _targetEntity?: number; // Entity ID

    constructor(markerType: number, markerAttachTo: string, pos: Vector3, entity?: number) {
        this._markerType = markerType;
        this._pos = pos;
        if (entity) {
            this._targetEntity = entity;
        }
        if (markerAttachTo === "entity" && !entity) {
            throw new Error("You need to provide a valid entity to attach to!");
        }

        this.setHandle();
        this.create();
        if (markerAttachTo === "entity") {
            this.attachPositionToEntity();
        }
    }

    get enabled(): boolean {
        return this._enabled;
    }

    get target(): number | undefined {
        return this._targetEntity;
    }

    get visible(): boolean {
        return this._enabled;
    }

    public setMovement(bobbing: boolean = false, rotate: boolean = false): void {
        this._bobUpAndDown = bobbing;
        this._rotate = rotate;
    }

    public setOpacity(opacity: number): void {
        this._alpha = opacity;
    }

    public setOffset(offset: Vector3): void {
        this._offset = offset;
    }

    public setSize(size: Vector3): void {
        this._size = size;
    }

    public setRotation(rot: Vector3): void {
        this._rot = rot;
    }

    public setColor(r: number, g: number, b: number): void {
        this._R = r;
        this._G = g;
        this._B = b;
    }

    public setPosition(pos: Vector3): void {
        this._pos = pos;
    }

    public async autoDispose(predicate: () => boolean, msInterval: number = 100): Promise<void> {
        while (predicate()) {
            await new Promise(resolve => setTimeout(resolve, msInterval));
        }
        this.dispose();
    }

    private async create(): Promise<void> {
        this._enabled = true;
        while (!this.destroyed) {
            if (this.enabled) {
                // Draw Marker using FiveM native methods
                DrawMarker(
                    this._markerType,
                    this._pos.x,
                    this._pos.y,
                    this._pos.z,
                    0,
                    0,
                    0,
                    this._rot.x,
                    this._rot.y,
                    this._rot.z,
                    this._size.x,
                    this._size.y,
                    this._size.z,
                    this._R,
                    this._G,
                    this._B,
                    this._alpha,
                    this._bobUpAndDown,
                    false,
                    2,
                    this._rotate,
                    "",
                    "",
                    false
                );
            }
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    public setTargetEntity(entity: number): void {
        this._targetEntity = entity;
    }

    private async attachPositionToEntity(): Promise<void> {
        while (!this.destroyed) {
            if (this._targetEntity) {
                const coords = GetEntityCoords(this._targetEntity, true);
                this._pos = new Vector3(
                    coords[0] + this._offset.x,
                    coords[1] + this._offset.y,
                    coords[2] + this._offset.z
                );
            }
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    public setVisibility(state: boolean): void {
        this._enabled = state;
    }

    public dispose(): void {
        this.destroyed = true;
        this._enabled = false;
    }

    private async setHandle(): Promise<void> {
        let handle: number = Math.floor(Math.random() * 100000);
        while (markers.has(handle) && !this.destroyed) {
            handle = Math.floor(Math.random() * 100000);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        this.handle = handle;
    }
}

// Global marker registry
const markers = new Map<number, Marker>();



/*const CarWashes: CarWash[] = [
    new CarWash(new Vector3(0, 0, 0), 0, 10),
];*/

/*const GetNearestCarWash = (pos: Vector3): CarWash => CarWashes.filter(wash => wash.Location.DistanceTo(pos) < 10).sort((a, b) => a.Location.DistanceTo(pos) - b.Location.DistanceTo(pos))[0] ?? undefined;*/

function ShowNotification(msg: string) {
    SetTextComponentFormat("STRING");
    AddTextComponentString(msg);
    DisplayHelpTextFromStringLabel(0, false, true, -1);
}

async function WaitUntilVehicleIsAtPosition(vehicle: number, pos: Vector3, radius: number) {
    var coords = GetEntityCoords(vehicle, true);
    var plrPos = new Vector3(coords[0], coords[1], coords[2]);
    while (pos.DistanceTo(pos) > radius) {
        coords = GetEntityCoords(vehicle, true);
        plrPos = new Vector3(coords[0], coords[1], coords[2]);
        Wait(100);
    }
}

async function RunWhile(fn: Function, predicate: Function, interval: number = 100) {
    while (predicate()) {
        fn();
        Wait(interval);
    }
}

async function Wash(vehicle: number, pos: Vector3, heading: number, length: number) {
    // Disable player controls over vehicle, take control over vehicle to make it drive in a fixed direction slowly, spawn water particle emitters like upside-down fire hydrants to spray water from above as vehicle drives through.
    console.log("Starting wash.")
    let running = true;
    RunWhile(function () {
        DisableAllControlActions(0);    
    }, () => running, 0).catch(() => {
        running = false;
        return;
    });
    RunWhile(function () {
        TaskVehicleDriveToCoord(GetPlayerPed(-1), vehicle, pos.x, pos.y, pos.z, 2, 0, GetEntityModel(vehicle), 16777216, 1.0, 1);    
    }, () => running, 500).catch(() => {
        running = false;
        return;
    });

    const forwardVector = GetEntityForwardVector(vehicle);
    const endPos = new Vector3(
        pos.x + length * forwardVector[0],
        pos.y + length * forwardVector[1],
        pos.z + length * forwardVector[2]
    );
    var marker = new Marker(1, "entity", endPos);
    marker.setColor(23, 117, 212);
    marker.setSize(Vector3.One());
    marker.setVisibility(true);
    
    marker.autoDispose(() => !running, 1000).catch(() => {});
    // Spawn water particle effects to spray at vehicle from above scattered across the length.
    
    await WaitUntilVehicleIsAtPosition(vehicle, endPos, 2);
    console.log("Wash complete.");
    running = false;
    // At the end, set vehicle as clean.
    SetVehicleDirtLevel(vehicle, 0);
}

function SprayWaterEffects(position: Vector3, duration: number) {
    const waterEffectName = "core_water_splash"; // Request or use an existing water effect
    const effectOffset = {x: 0, y: 0, z: 5}; // 5 feet above the position

    const startEffect = () => {
        const effectPos = {
            x: position.x + effectOffset.x,
            y: position.y + effectOffset.y,
            z: position.z + effectOffset.z
        };

        RequestNamedPtfxAsset("core"); // Make the effect asset available
        while (!HasNamedPtfxAssetLoaded("core")) {
            Wait(0); // Wait until the effect asset is fully loaded
        }

        UseParticleFxAssetNextCall("core"); // Use the loaded effect asset
        StartParticleFxNonLoopedAtCoord(
            waterEffectName,
            effectPos.x,
            effectPos.y,
            effectPos.z,
            0,
            180,
            0,
            1.0,
            false,
            false,
            false
        );
    };

    const startTime = GetGameTimer();
    while (GetGameTimer() - startTime < duration) {
        startEffect(); // Trigger the water spray effect
        Wait(500); // Wait between each effect trigger
    }
}

onNet("wash:success", (pos: object, heading: number, length: number) => {
    var Location = Vector3.FromObject(pos);
    ShowNotification("[Approved]: Drive slowly into the wash.");
    var vehicle = GetVehiclePedIsIn(PlayerPedId(), false);
    if (!DoesEntityExist(vehicle)) {
        return;
    }
    var modelLength = GetModelDimensions(GetEntityModel(vehicle))[0][1];
    WaitUntilVehicleIsAtPosition(vehicle, Location, modelLength).then(async () => {
        await Wash(vehicle, Location, heading, length);
    }).catch(() => {
        ShowNotification("[Wash Failed]: Unknown reason.");
    })
})
onNet("wash:error", (msg: string) => {
    ShowNotification(`[Wash Failed]: ${msg}`);
});


console.log("Loaded InteractiveWashes by DevKilo!");