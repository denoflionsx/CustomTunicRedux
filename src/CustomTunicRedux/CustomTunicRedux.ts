import CustomTunicReduxClient from "./CustomTunicReduxClient";
import { ProxySide, SidedProxy } from 'modloader64_api/SidedProxy/SidedProxy';

export default class CustomTunicRedux{

    @SidedProxy(ProxySide.CLIENT, CustomTunicReduxClient)
    client!: CustomTunicReduxClient;

}