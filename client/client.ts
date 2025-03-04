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

async function Wash(pos: Vector3, heading: number, length: number) {
    // Disable player controls over vehicle, take control over vehicle to make it drive in a fixed direction slowly, spawn water particle emitters like upside-down fire hydrants to spray water from above as vehicle drives through.
    // At the end, set vehicle as clean.
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
        await Wash(Location, heading, length);
    }).catch(() => {
        ShowNotification("[Wash Failed]: Unknown reason.");
    })
})
onNet("wash:error", (msg: string) => {
    ShowNotification(`[Wash Failed]: ${msg}`);
});


console.log("Loaded InteractiveWashes by DevKilo!");