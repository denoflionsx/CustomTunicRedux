import { IPlugin, IModLoaderAPI, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import path from 'path';
import { TunnelMessageHandler } from 'modloader64_api/GUITunnel';
import { EventHandler } from 'modloader64_api/EventHandler';
import { Z64RomTools, DMATable } from 'Z64Lib/API/Z64RomTools';
import fs from 'fs';
import Jimp from 'jimp';
import { OotEvents } from 'modloader64_api/OOT/OOTAPI';
var convert = require('color-convert');

class Tunics {
    kokiri!: string;
    goron!: string;
    zora!: string;
}

class ColorPacket {
    id!: string;
    colors!: Tunics;
}

class rgba {
    r!: number;
    g!: number;
    b!: number;
    a!: number;

    fromArray(arr: Array<number>): rgba {
        this.r = arr[0];
        this.g = arr[1];
        this.b = arr[2];
        this.a = 0xFF;
        return this;
    }
}

class hsvf_t {
    h!: number;
    s!: number;
    v!: number;

    fromArray(arr: Array<number>): hsvf_t {
        this.h = arr[0];
        this.s = arr[1];
        this.v = arr[2];
        return this;
    }
}

function hexToRgb(hex: string): rgba {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    let arr = [parseInt(result![1], 16), parseInt(result![2], 16), parseInt(result![3], 16)]
    return new rgba().fromArray(arr);
}

function zh_color_hsv2rgb(h: number, s: number, v: number) {
    return new rgba().fromArray(convert.hsv.rgb(h, s, v));
}

function zh_color_rgb2hsv(rgba: rgba): hsvf_t {
    return new hsvf_t().fromArray(convert.rgb.hsv(rgba.r, rgba.g, rgba.b));
}

class CustomTunicRedux implements IPlugin {

    ModLoader!: IModLoaderAPI;
    isUpdatingRom: boolean = false;
    lastStatus: boolean = false;
    ready: boolean = true;
    queue: Array<() => void> = [];
    iconBank!: Buffer;
    baseTunic!: Buffer;
    workingBuffer!: Buffer;

    preinit(): void {
    }
    init(): void {
    }
    postinit(): void {
        this.ModLoader.gui.openWindow(300, 300, path.resolve(__dirname, "gui", "index.html"));
    }
    onTick(frame?: number | undefined): void {
        if (this.queue.length > 0 && this.ready) {
            let a = this.queue.pop()!;
            a();
        }
        if (this.lastStatus !== this.isUpdatingRom) {
            if (this.isUpdatingRom) {
                this.ModLoader.logger.debug("Calculating tunic icons.");
            } else {
                this.ModLoader.logger.debug("Updating tunic icons.");
                let rom = this.ModLoader.rom.romReadBuffer(0, (32 * 1024 * 1024));
                let tools: Z64RomTools = new Z64RomTools(this.ModLoader, 0x7430);
                let i = tools.decompressFileFromRom(rom, 8);
                this.workingBuffer.copy(i);
                tools.recompressFileIntoRom(rom, 8, i);
                this.ModLoader.rom.romWriteBuffer(0, rom);
            }
        }
        this.lastStatus = this.isUpdatingRom;
    }

    private setColor(hex: string, index: number) {
        let k: Buffer = Buffer.alloc(0x3);
        let rgb = hexToRgb(hex);
        k.writeUInt8(rgb.r, 0);
        k.writeUInt8(rgb.g, 1);
        k.writeUInt8(rgb.b, 2);
        this.ModLoader.emulator.rdramWriteBuffer(0x800F7AD8 + (index * 0x3), k);
        return rgb;
    }

    @TunnelMessageHandler("CustomTunicRedux:DataUpdate")
    onDataUpdate(packet: ColorPacket) {
        let k = this.setColor(packet.colors.kokiri, 0);
        let g = this.setColor(packet.colors.goron, 1);
        let z = this.setColor(packet.colors.zora, 2);
        this.isUpdatingRom = true;
        this.ModLoader.utils.cloneBuffer(this.iconBank).copy(this.workingBuffer);
        this.addToQueue(this.workingBuffer, k, 0);
        this.addToQueue(this.workingBuffer, g, 1);
        this.addToQueue(this.workingBuffer, z, 2);
    }

    addToQueue(icons: Buffer, k: rgba, index: number) {
        let a = () => {
            this.ready = false;
            let png = new Jimp(32, 32, (err, image) => {
                image.bitmap.data = this.ModLoader.utils.cloneBuffer(this.baseTunic);
                image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
                    let pixel = new rgba();
                    pixel.r = image.bitmap.data[idx + 0];
                    pixel.g = image.bitmap.data[idx + 1];
                    pixel.b = image.bitmap.data[idx + 2];
                    pixel.a = image.bitmap.data[idx + 3];
                    if (pixel.a > 0) {
                        if (pixel.r === 0 && pixel.g === 0 && pixel.b === 0) {
                            return;
                        }
                        let source = zh_color_rgb2hsv(pixel);

                        if (source.h > 60) {
                            pixel.r = k.r;
                            pixel.g = k.g;
                            pixel.b = k.b;
                            pixel.a = k.a;

                            let hsv = zh_color_rgb2hsv(pixel);
                            hsv.s = source.s;
                            hsv.v = source.v;
                            pixel = zh_color_hsv2rgb(hsv.h, hsv.s, hsv.v);

                            image.bitmap.data[idx + 0] = pixel.r;
                            image.bitmap.data[idx + 1] = pixel.g;
                            image.bitmap.data[idx + 2] = pixel.b;
                        }
                    }
                });
                image.bitmap.data.copy(icons, 0x41000 + (index * 0x1000));
                image.getBase64("image/png", (err: Error | null, result: string)=>{
                    this.ModLoader.gui.tunnel.send("CustomTunicRedux:UpdateIcon", {index, result});
                });
                this.ready = true;
                if (this.queue.length === 0) {
                    this.isUpdatingRom = false;
                }
            });
        };
        this.queue.push(a);
    }

    @EventHandler(ModLoaderEvents.ON_ROM_PATCHED_POST)
    onRomPatched(evt: any) {
        let tools: Z64RomTools = new Z64RomTools(this.ModLoader, 0x7430);
        let i = tools.decompressFileFromRom(evt.rom, 8);
        this.iconBank = Buffer.alloc(i.byteLength);
        i.copy(this.iconBank);
        this.baseTunic = Buffer.alloc(0x1000);
        this.iconBank.copy(this.baseTunic, 0, 0x41000, 0x41000 + 0x1000);
        this.workingBuffer = Buffer.alloc(this.iconBank.byteLength);
    }

    @EventHandler(OotEvents.ON_SAVE_LOADED)
    onSave() {
/*         let k = this.setColor("#FF00FF", 0);
        let g = this.setColor("#FF00FF", 1);
        let z = this.setColor("#FF00FF", 2);
        this.isUpdatingRom = true;
        this.ModLoader.utils.cloneBuffer(this.iconBank).copy(this.workingBuffer);
        this.addToQueue(this.workingBuffer, k, 0);
        this.addToQueue(this.workingBuffer, g, 1);
        this.addToQueue(this.workingBuffer, z, 2); */
    }

}

module.exports = CustomTunicRedux;