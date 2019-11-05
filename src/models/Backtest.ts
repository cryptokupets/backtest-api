import { streamTrades } from "backtesting";
import { ObjectID } from "mongodb";
import { Edm, odata } from "odata-v4-server";
import connect from "../connect";

const collectionName = "backtest";

export class Backtest {
  @Edm.Key
  @Edm.Computed
  @Edm.String
  // tslint:disable-next-line: variable-name
  public _id: ObjectID;

  @Edm.String
  public exchange: string;

  @Edm.String
  public currency: string;

  @Edm.String
  public asset: string;

  @Edm.Double
  public period: number;

  @Edm.String
  public begin: string;

  @Edm.String
  public end: string;

  @Edm.String
  public indicators: string;

  @Edm.String
  public code: string;

  @Edm.Double
  public initialBalance: number;

  @Edm.Double
  public finalBalance: number;

  @Edm.Double
  public profit: number;

  constructor(data: any) {
    Object.assign(this, data);
  }

  @Edm.Action
  public async execute(@odata.result result: any): Promise<number> {
    const { _id: key } = result;
    // tslint:disable-next-line: variable-name
    const _id = new ObjectID(key);
    const db = await connect();
    const backtest = new Backtest(
      await db.collection(collectionName).findOne({ _id })
    );
    const {
      asset,
      currency,
      exchange,
      period,
      begin,
      end,
      indicators,
      initialBalance,
      code
    } = backtest;

    const rs = streamTrades({
      exchange,
      currency,
      asset,
      period,
      start: begin,
      end,
      indicators: JSON.parse(indicators),
      code,
      initialBalance
    });

    const trades: Array<{ amount: number }> = [];
    rs.on("data", chunk => trades.push(JSON.parse(chunk)));

    return new Promise(resolve => {
      rs.on("end", resolve);
    })
      .then(() =>
        db.collection(collectionName).updateOne(
          { _id },
          {
            $set: {
              finalBalance: Math.abs(trades[trades.length - 1].amount)
            }
          }
        )
      )
      .then(r => r.modifiedCount);
  }
}
