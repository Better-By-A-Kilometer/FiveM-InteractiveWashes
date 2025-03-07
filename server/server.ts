﻿class Vector3 {
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
    async Start(ped: number, vehicleNetId: number) {
        var vehicle = NetworkGetEntityFromNetworkId(vehicleNetId);
        if (!DoesEntityExist(vehicle)) throw new Error("Invalid vehicle");
        if (this._isOccupied) throw new Error("Wash is currently in use!");
        this.player = NetworkGetNetworkIdFromEntity(ped);
        this._isOccupied = true;
        return true;
    }
}

const CarWashes: CarWash[] = [
    new CarWash(new Vector3(0, 0, 0), 0, 10),
];

const GetNearestCarWash = (pos: Vector3): CarWash => CarWashes.filter(wash => wash.Location.DistanceTo(pos) < 10).sort((a, b) => a.Location.DistanceTo(pos) - b.Location.DistanceTo(pos))[0] ?? undefined;

onNet("wash:start", (vehicleNetId: number) => {
    var ped = GetPlayerPed(GetPlayerFromIndex(source));
    if (!DoesEntityExist(ped)) return;
    var pedCoords = GetEntityCoords(ped);
    let carWash = GetNearestCarWash(new Vector3(pedCoords[0], pedCoords[1], pedCoords[2]));
    if (carWash)
        carWash.Start(ped, vehicleNetId).then(res => {
            if (res)
                emitNet("wash:success", source, carWash.Location as object, carWash.Heading, carWash.Length);
            else
                emitNet("wash:error", source, "Wash is not currently available.");
        }).catch((e: Error) => {
            emitNet("wash:error", source, e.message);
            console.error(e);
        });
});