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
  }
  
  const handlers = new MapMessageHandlers();

  const tunicValues: any = {};

  let kokiri: HTMLInputElement = document.getElementById("kokiri") as HTMLInputElement;
  if (kokiri !== null){
    tunicValues["kokiri"] = kokiri.value;
  }

  let goron: HTMLInputElement = document.getElementById("goron") as HTMLInputElement;
  if (goron !== null){
    tunicValues["goron"] = goron.value;
  }

  let zora: HTMLInputElement = document.getElementById("zora") as HTMLInputElement;
  if (zora !== null){
    tunicValues["zora"] = zora.value;
  }

  handlers.tunnel.send("forwardToML", {id: "CustomTunicRedux:DataUpdate", colors: tunicValues});

  module.exports = hooks;