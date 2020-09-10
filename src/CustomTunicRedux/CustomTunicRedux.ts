import { IPlugin, IModLoaderAPI, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import { EventHandler } from 'modloader64_api/EventHandler';
import { onViUpdate } from 'modloader64_api/PluginLifecycle';
import { OotEvents, IOOTCore } from 'modloader64_api/OOT/OOTAPI';
import { vec4, rgba } from 'modloader64_api/Sylvain/vec';
import { InjectCore } from 'modloader64_api/CoreInjection';

class rgbaCTR {
    r!: number;
    g!: number;
    b!: number;
    a!: number;

    fromArray(arr: Array<number>): rgbaCTR {
        this.r = arr[0];
        this.g = arr[1];
        this.b = arr[2];
        this.a = 0xFF;
        return this;
    }

    fromVec4(vec: vec4) {
        let v = 1 / 255;
        this.r = vec.x / v;
        this.g = vec.y / v;
        this.b = vec.z / v;
        this.a = vec.w / v;
        return this;
    }
}

function hexToRgb(hex: string): rgbaCTR {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    let arr = [parseInt(result![1], 16), parseInt(result![2], 16), parseInt(result![3], 16)]
    return new rgbaCTR().fromArray(arr);
}

function RgbtoHex(vec: vec4): string{
    let v = 1 / 255;
    return "#" + hexPadding2(Math.floor(vec.x / v)) + hexPadding2(Math.floor(vec.y / v)) + hexPadding2(Math.floor(vec.z / v));
}

function hexPadding2(i: number): string {
    return ('00' + i.toString(16)).substr(-2).toUpperCase();
}

interface CustomTunicRedux_Config {
    kokiri: string;
    goron: string;
    zora: string;
    gauntlets: string;
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
    config!: CustomTunicRedux_Config
    // ImGui
    kokiri: vec4 = rgba(0, 0, 0, 0);
    goron: vec4 = rgba(0, 0, 0, 0);
    zora: vec4 = rgba(0, 0, 0, 0);
    saveNext: boolean = false;
    @InjectCore()
    core!: IOOTCore;

    preinit(): void {
    }
    init(): void {
        this.config = this.ModLoader.config.registerConfigCategory("CustomTunicRedux") as CustomTunicRedux_Config;
        this.ModLoader.config.setData("CustomTunicRedux", "kokiri", "#1e691b");
        this.ModLoader.config.setData("CustomTunicRedux", "goron", "#641400");
        this.ModLoader.config.setData("CustomTunicRedux", "zora", "#003c64");
        this.ModLoader.config.setData("CustomTunicRedux", "gauntlets", "#ffffff");
    }
    postinit(): void {
    }
    onTick(frame?: number | undefined): void {
    }

    @EventHandler(OotEvents.ON_SCENE_CHANGE)
    onSceneChange(){
        if (this.saveNext){
            this.ModLoader.config.save();
        }
    }

    @onViUpdate()
    onVi() {
        try{
            if (this.ModLoader.ImGui.beginMainMenuBar()) {
                if (this.ModLoader.ImGui.beginMenu("Mods")) {
                    if (this.ModLoader.ImGui.beginMenu("Custom Tunic Redux")) {
                        if (this.ModLoader.ImGui.beginMenu("Kokiri Tunic")){
                            if (this.ModLoader.ImGui.colorPicker4("Kokiri Tunic", this.kokiri, undefined, this.kokiri)) {
                                let a = RgbtoHex(this.kokiri);
                                this.ModLoader.config.setData("CustomTunicRedux", "kokiri", a, true);
                                this.setColor(a, 0);
                                this.saveNext = true;
                            }
                            this.ModLoader.ImGui.endMenu();
                        }
                        if (this.ModLoader.ImGui.beginMenu("Goron Tunic")){
                            if (this.ModLoader.ImGui.colorPicker4("Goron Tunic", this.goron, undefined, this.goron)) {
                                let a = RgbtoHex(this.goron);
                                this.ModLoader.config.setData("CustomTunicRedux", "goron", a, true);
                                this.setColor(a, 1);
                                this.saveNext = true;
                            }
                            this.ModLoader.ImGui.endMenu();
                        }
                        if (this.ModLoader.ImGui.beginMenu("Zora Tunic")){
                            if (this.ModLoader.ImGui.colorPicker4("Zora Tunic", this.zora, undefined, this.zora)) {
                                let a = RgbtoHex(this.zora);
                                this.ModLoader.config.setData("CustomTunicRedux", "zora", a, true);
                                this.setColor(a, 2);
                                this.saveNext = true;
                            }
                            this.ModLoader.ImGui.endMenu();
                        }
                        this.ModLoader.ImGui.endMenu();
                    }
                    this.ModLoader.ImGui.endMenu();
                }
                this.ModLoader.ImGui.endMainMenuBar();
            }
        }catch(err){
            console.log(err.stack);
        }
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

    @EventHandler(OotEvents.ON_SAVE_LOADED)
    onSave() {
        let k = this.setColor(this.config.kokiri, 0);
        let g = this.setColor(this.config.goron, 1);
        let z = this.setColor(this.config.zora, 2);
        this.kokiri = rgba(k.r, k.g, k.b, k.a);
        this.goron = rgba(g.r, g.g, g.b, g.a);
        this.zora = rgba(z.r, z.g, z.b, z.a);
    }

}

module.exports = CustomTunicRedux;