import { IPlugin, IModLoaderAPI } from 'modloader64_api/IModLoaderAPI';
import path from 'path';
import { TunnelMessageHandler } from 'modloader64_api/GUITunnel';

class Tunics{
    kokiri!: string;
    goron!: string;
    zora!: string;
}

class ColorPacket {
    id!: string;
    colors!: Tunics;
}

function hexToRgb(hex: string) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

class CustomTunicRedux implements IPlugin {

    ModLoader!: IModLoaderAPI;
    pluginName?: string | undefined;

    /*
    -- Kokiri Tunic
    810F7AD8 1E69
    800F7ADA 001B
    -- Goron Tunic
    810F7ADB 6414
    800F7ADD 0000
    -- Zora Tunic
    810F7ADE 003C
    800F7AE0 0064
     */

    preinit(): void {
    }
    init(): void {
    }
    postinit(): void {
        this.ModLoader.gui.openWindow(300, 300, path.resolve(__dirname, "gui", "index.html"));
    }
    onTick(frame?: number | undefined): void {
    }

    private setColor(hex: string, index: number){
        let k: Buffer = Buffer.alloc(0x3);
        let rgb = hexToRgb(hex);
        k.writeUInt8(rgb!.r, 0);
        k.writeUInt8(rgb!.g, 1);
        k.writeUInt8(rgb!.b, 2);
        this.ModLoader.emulator.rdramWriteBuffer(0x800F7AD8 + (index * 0x3), k);
    }

    @TunnelMessageHandler("CustomTunicRedux:DataUpdate")
    onDataUpdate(packet: ColorPacket) {
        this.setColor(packet.colors.kokiri, 0);
        this.setColor(packet.colors.goron, 0);
        this.setColor(packet.colors.zora, 0);
    }

}

module.exports = CustomTunicRedux;