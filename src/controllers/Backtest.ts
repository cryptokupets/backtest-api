import { ObjectID } from "mongodb";
import { createQuery } from "odata-v4-mongodb";
import { Edm, odata, ODataController, ODataQuery } from "odata-v4-server";
import connect from "../connect";
import { Backtest } from "../models/Backtest";
import { Trade } from "../models/Trade";

const collectionName = "backtest";

@odata.type(Backtest)
@Edm.EntitySet("Backtest")
export class BacktestController extends ODataController {
  @odata.GET
  public async get(@odata.query query: ODataQuery): Promise<Backtest[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);

    if (mongodbQuery.query._id) {
      mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    }

    const result: Backtest[] & { inlinecount?: number } =
      typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0
        ? []
        : await db
            .collection(collectionName)
            .find(mongodbQuery.query)
            .project(mongodbQuery.projection)
            .skip(mongodbQuery.skip || 0)
            .limit(mongodbQuery.limit || 0)
            .sort(mongodbQuery.sort)
            .map(e => new Backtest(e))
            .toArray();

    if (mongodbQuery.inlinecount) {
      result.inlinecount = await db
        .collection(collectionName)
        .find(mongodbQuery.query)
        .project(mongodbQuery.projection)
        .count(false);
    }
    return result;
  }

  @odata.GET
  public async getById(
    @odata.key key: string,
    @odata.query query: ODataQuery
  ): Promise<Backtest> {
    const { projection } = createQuery(query);
    // tslint:disable-next-line: variable-name
    const _id = new ObjectID(key);
    const db = await connect();
    return new Backtest(
      await db.collection(collectionName).findOne({ _id }, { projection })
    );
  }

  @odata.POST
  public async post(
    @odata.body
    body: any
  ): Promise<Backtest> {
    const backtest = new Backtest(body);
    backtest._id = (await (await connect())
      .collection(collectionName)
      .insertOne(backtest)).insertedId;
    return backtest;
  }

  @odata.PATCH
  public async patch(
    @odata.key key: string,
    @odata.body delta: any
  ): Promise<number> {
    if (delta._id) {
      delete delta._id;
    }
    // tslint:disable-next-line: variable-name
    const _id = new ObjectID(key);
    return (await connect())
      .collection(collectionName)
      .updateOne({ _id }, { $set: delta })
      .then(result => result.modifiedCount);
  }

  @odata.DELETE
  public async remove(@odata.key key: string): Promise<number> {
    // tslint:disable-next-line: variable-name
    const _id = new ObjectID(key);
    return (await connect())
      .collection(collectionName)
      .deleteOne({ _id })
      .then(result => result.deletedCount);
  }

  @odata.GET("Trades")
  public async getTrades(
    @odata.result result: Backtest,
    @odata.query query: ODataQuery
  ): Promise<Trade[]> {
    const db = await connect();
    const collection = db.collection("trade");
    const mongodbQuery = createQuery(query);
    const parentId = new ObjectID(result._id);
    const trades: any =
      typeof mongodbQuery.limit === "number" && mongodbQuery.limit === 0
        ? []
        : await collection
            .find({ $and: [{ parentId }, mongodbQuery.query] })
            .project(mongodbQuery.projection)
            .skip(mongodbQuery.skip || 0)
            .limit(mongodbQuery.limit || 0)
            .sort(mongodbQuery.sort)
            .toArray();
    if (mongodbQuery.inlinecount) {
      trades.inlinecount = await collection
        .find({ $and: [{ parentId }, mongodbQuery.query] })
        .project(mongodbQuery.projection)
        .count(false);
    }
    return trades;
  }
}
