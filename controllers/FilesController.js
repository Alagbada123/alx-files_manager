import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import Bull from "bull";
import mime from "mime-types";
import dbClient from "../utils/db";
import redisClient from "../utils/redis";

const fileQueue = new Bull("fileQueue");
const FOLDER_PATH = process.env.FOLDER_PATH || "/tmp/files_manager";

class FilesController {
  static async postUpload(req, res) {
    const token = req.header("X-Token");
    if (!token) return res.status(401).send({ error: "Unauthorized" });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: "Unauthorized" });

    const { name, type, parentId = "0", isPublic = false, data } = req.body;
    if (!name) return res.status(400).send({ error: "Missing name" });
    const acceptedTypes = ["folder", "file", "image"];
    if (!type || !acceptedTypes.includes(type))
      return res.status(400).send({ error: "Missing type" });
    if (!data && type !== "folder")
      return res.status(400).send({ error: "Missing data" });

    const files = await dbClient.files();
    if (parentId !== "0") {
      const parentFile = await files.findOne({ _id: new ObjectId(parentId) });
      if (!parentFile)
        return res.status(400).send({ error: "Parent not found" });
      if (parentFile.type !== "folder")
        return res.status(400).send({ error: "Parent is not a folder" });
    }

    const newFile = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === "0" ? 0 : new ObjectId(parentId),
    };

    if (type === "folder") {
      const result = await files.insertOne(newFile);
      return res.status(201).send({ id: result.insertedId, ...newFile });
    }

    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
    }

    const localPath = `${FOLDER_PATH}/${uuidv4()}`;
    fs.writeFileSync(localPath, Buffer.from(data, "base64"));
    newFile.localPath = localPath;

    const result = await files.insertOne(newFile);

    if (type === "image") {
      fileQueue.add({ userId, fileId: result.insertedId.toString() });
    }

    return res.status(201).send({ id: result.insertedId, ...newFile });
  }

  static async getShow(req, res) {
    const token = req.header("X-Token");
    if (!token) return res.status(401).send({ error: "Unauthorized" });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: "Unauthorized" });

    const file = await (
      await dbClient.files()
    ).findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId),
    });

    if (!file) return res.status(404).send({ error: "Not found" });

    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const token = req.header("X-Token");
    if (!token) return res.status(401).send({ error: "Unauthorized" });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: "Unauthorized" });

    const parentId = req.query.parentId || "0";
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;

    const files = await dbClient.files();
    const aggregateQuery = [
      {
        $match: {
          parentId: parentId === "0" ? 0 : new ObjectId(parentId),
          userId: new ObjectId(userId),
        },
      },
      { $skip: page * pageSize },
      { $limit: pageSize },
    ];

    const fileList = await files.aggregate(aggregateQuery).toArray();

    return res.status(200).send(fileList);
  }

  static async putPublish(req, res) {
    const token = req.header("X-Token");
    if (!token) return res.status(401).send({ error: "Unauthorized" });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: "Unauthorized" });

    const files = await dbClient.files();
    const result = await files.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: new ObjectId(userId) },
      { $set: { isPublic: true } },
      { returnDocument: "after" },
    );

    if (!result.value) return res.status(404).send({ error: "Not found" });

    return res.status(200).send(result.value);
  }

  static async putUnpublish(req, res) {
    const token = req.header("X-Token");
    if (!token) return res.status(401).send({ error: "Unauthorized" });
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).send({ error: "Unauthorized" });

    const files = await dbClient.files();
    const result = await files.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: new ObjectId(userId) },
      { $set: { isPublic: false } },
      { returnDocument: "after" },
    );

    if (!result.value) return res.status(404).send({ error: "Not found" });

    return res.status(200).send(result.value);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const file = await (
      await dbClient.files()
    ).findOne({ _id: new ObjectId(fileId) });
    if (!file) return res.status(404).send({ error: "Not found" });

    const token = req.header("X-Token");
    const userId = token ? await redisClient.get(`auth_${token}`) : null;

    if (!file.isPublic && (!userId || file.userId.toString() !== userId)) {
      return res.status(404).send({ error: "Not found" });
    }

    if (file.type === "folder") {
      return res.status(400).send({ error: "A folder doesn't have content" });
    }

    let filePath = file.localPath;
    const { size } = req.query;
    if (size) {
      if (!["500", "250", "100"].includes(size)) {
        return res.status(400).send({ error: "Invalid size parameter" });
      }
      filePath = `${file.localPath}_${size}`;
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ error: "Not found" });
    }

    const mimeType = mime.lookup(file.name);
    res.setHeader("Content-Type", mimeType);
    return res.status(200).sendFile(filePath);
  }
}

export default FilesController;
