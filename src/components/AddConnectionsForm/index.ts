import * as z from 'zod';
import { connectionColors, schemes } from '../../interfaces';

const MIN_LENGTH_STR = 2;
const MAX_LENGTH_STR = 255;
const MAX_PORT = 65535;
const MIN_PORT = 1;

export const ConnectionFormSchema = z.object({
  connection_name: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  color: z.enum(connectionColors),
  scheme: z.enum(schemes),
  username: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  password: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  save_password: z.boolean().default(false),
  host: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  port: z.number().min(MIN_PORT).max(MAX_PORT),
  dbname: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  params: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
});

export type ConnectionFormInput = z.infer<typeof ConnectionFormSchema>;

