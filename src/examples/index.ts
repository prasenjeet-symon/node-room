import cors from "cors";
import express from "express";
import { BootstrapNode } from "..";
import { TodoRoom } from "./room";

const APP = express();
APP.use(cors());
APP.use(express.json());

const NODE_APP = BootstrapNode.init(APP, { databases: [TodoRoom] }).APP();

NODE_APP.listen("4000", () => {
  console.log("Server is running on port 4000");
});
