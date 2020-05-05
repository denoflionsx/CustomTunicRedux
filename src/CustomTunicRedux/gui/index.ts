import { MessageLayer } from 'modloader64_api/MessageLayer';
import {
  TunnelMessageHandler,
  GUITunnelPacket,
} from 'modloader64_api/GUITunnel';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const hooks = {
};

class MapMessageHandlers {
  tunnel: MessageLayer;

  constructor() {
    this.tunnel = new MessageLayer('CustomTunicRedux', ipc, ipc);
    this.tunnel.setupMessageProcessor(this);
  }

  @TunnelMessageHandler("CustomTunicRedux:ColorUpdate")
  onColorUpdate(evt: any){
    let e = document.getElementById(evt.tunic) as HTMLInputElement;
    e.value = evt.value;
  }

  @TunnelMessageHandler("CustomTunicRedux:UpdateIcon")
  onIconUpdate(evt: any) {
    let e: HTMLImageElement;
    switch (evt.index) {
      case 0:
        e = document.getElementById("icon_kokiri") as HTMLImageElement;
        e.src = evt.result;
        break;
      case 1:
        e = document.getElementById("icon_goron") as HTMLImageElement;
        e.src = evt.result;
        break;
      case 2:
        e = document.getElementById("icon_zora") as HTMLImageElement;
        e.src = evt.result;
        break;
    }
  }
}

const handlers = new MapMessageHandlers();

const tunicValues: any = {};

let kokiri: HTMLInputElement = document.getElementById("kokiri") as HTMLInputElement;
if (kokiri !== null) {
  tunicValues["kokiri"] = kokiri.value;
}

let goron: HTMLInputElement = document.getElementById("goron") as HTMLInputElement;
if (goron !== null) {
  tunicValues["goron"] = goron.value;
}

let zora: HTMLInputElement = document.getElementById("zora") as HTMLInputElement;
if (zora !== null) {
  tunicValues["zora"] = zora.value;
}

kokiri.onchange = () => {
  tunicValues["kokiri"] = kokiri.value;
  handlers.tunnel.send("forwardToML", { id: "CustomTunicRedux:DataUpdate", colors: tunicValues });
}

goron.onchange = () => {
  tunicValues["goron"] = goron.value;
  handlers.tunnel.send("forwardToML", { id: "CustomTunicRedux:DataUpdate", colors: tunicValues });
}

zora.onchange = () => {
  tunicValues["zora"] = zora.value;
  handlers.tunnel.send("forwardToML", { id: "CustomTunicRedux:DataUpdate", colors: tunicValues });
}

module.exports = hooks;