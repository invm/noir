import * as z from 'zod';
import { connectionColors, ConnectionModes, ConnectionConfig, connectionModes, schemes, SchemeType, SchemeCredentialsMap, ConnectionMode, ConnectionModeToCredentialsMap } from '../../interfaces';
import { omit } from '../../utils/utils';

const MIN_LENGTH_STR = 2;
const MAX_LENGTH_STR = 255;
const MAX_PORT = 65535;
const MIN_PORT = 1;

const messages = {
  length: 'Must be between 2 and 255 characters',
}

export const ConnectionFormSchema = z.object({
  name: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length),
  color: z.enum(connectionColors),
  scheme: z.enum(schemes),
  mode: z.enum(connectionModes),
  username: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length),
  password: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length),
  host: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length).optional().or(z.literal('')),
  file: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length).optional().or(z.literal('')),
  socket_path: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length).optional().or(z.literal('')),
  port: z.number().min(MIN_PORT).max(MAX_PORT).optional(),
  dbname: z.string().optional(),
});

export const formToConnectionStruct = (form: z.infer<typeof ConnectionFormSchema>) => {
  const { name, color, scheme: scheme_type, mode, ...rest } = form;
  let scheme = { [scheme_type]: { [mode]: rest } };

  switch (mode) {
    case ConnectionModes.Host:
      scheme[scheme_type][mode] = omit(scheme[scheme_type][mode], 'socket_path', 'file');
      break;
    case ConnectionModes.Socket:
      scheme[scheme_type][mode] = omit(scheme[scheme_type][mode], 'host', 'port', 'file');
      break;
    case ConnectionModes.File:
      scheme[scheme_type][mode] = omit(scheme[scheme_type][mode], 'host', 'port', 'socket_path');
      break;
  }

  return { name, color, scheme }
}

export * from './AddConnectionForm'
