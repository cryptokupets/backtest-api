import { odata, ODataServer } from "odata-v4-server";
import { BacktestController } from "./controllers/Backtest";

@odata.cors
@odata.namespace("Backtest")
@odata.controller(BacktestController, true)
export class BacktestServer extends ODataServer {}
