import * as z from 'zod';
import { connectionColors, ConnectionMode, connectionModes, schemes, HostCredentials, SocketCredentials, FileCredentials } from '../../interfaces';
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


type ConnectionForm = z.infer<typeof ConnectionFormSchema>;

export const formToConnectionStruct = (form: ConnectionForm) => {
  const { name, color, scheme, mode, ...rest } = form;

  switch (mode) {
    case ConnectionMode.Host: {
      const creds: HostCredentials = omit(rest, 'socket_path', 'file');
      return { name, color, scheme: { [scheme]: { [mode]: creds } } }
    }
    case ConnectionMode.Socket: {
      const creds: SocketCredentials = omit(rest, 'host', 'port', 'file');
      return { name, color, scheme: { [scheme]: { [mode]: creds } } }
    }
    case ConnectionMode.File: {
      const creds: FileCredentials = omit(rest, 'host', 'port', 'socket_path');
      return { name, color, scheme: { [scheme]: { [mode]: creds } } }
    }
  }
}

export * from './AddConnectionForm'
