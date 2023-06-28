import * as z from 'zod';
import { connectionColors, schemes } from '../../interfaces';

const MIN_LENGTH_STR = 2;
const MAX_LENGTH_STR = 255;
const MAX_PORT = 65535;
const MIN_PORT = 1;

const messages = {
  length: 'Must be between 2 and 255 characters',
}

export const ConnectionFormSchema = z.object({
  connection_name: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length),
  color: z.enum(connectionColors),
  scheme: z.enum(schemes),
  username: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length),
  password: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length),
  save_password: z.boolean().default(false),
  host: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length),
  port: z.number().min(MIN_PORT).max(MAX_PORT),
  dbname: z.string().optional(),
  params: z.string().optional(),
});

export * from './AddConnectionForm'
