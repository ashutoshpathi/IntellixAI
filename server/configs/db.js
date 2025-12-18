import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config();

const sql = neon(`${process.env.DATABASE_URL}`);

export default sql;