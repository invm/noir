import * as z from 'zod';
import { useFormHandler } from 'solid-form-handler';
import { zodSchema } from 'solid-form-handler/zod';
import { t } from 'i18next';
import { Match, onMount, Show, Switch } from 'solid-js';

import { Alert, TextInput, Select, ColorCircle } from '../UI';
import {
  PORTS_MAP, Schemes, AvailableConnectionModes, SocketPathDefaults,
  connectionColors, ConnectionMode, connectionModes, schemes, HostCredentials, SocketCredentials, FileCredentials, Scheme
} from '../../interfaces';
import { titleCase } from '../../utils/formatters';
import { FileInput } from './../UI/FileInput';
import { omit } from '../../utils/utils';
import { useAppSelector } from '../../services/Context';

const MIN_LENGTH_STR = 2;
const MAX_LENGTH_STR = 255;
const MAX_PORT = 65535;
const MIN_PORT = 1;

const messages = {
  length: t('components.add_connection_form.length_validation')
}

export const ConnectionFormSchema = z.object({
  name: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length),
  scheme: z.enum(schemes),
  mode: z.enum(connectionModes),
  username: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length).optional().or(z.literal('')),
  password: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length).optional().or(z.literal('')),
  host: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length).optional().or(z.literal('')),
  file: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length).optional().or(z.literal('')),
  socket_path: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length).optional().or(z.literal('')),
  port: z.coerce.number().min(MIN_PORT).max(MAX_PORT).optional().or(z.literal(0)),
  dbname: z.string().optional().or(z.literal('')),
  color: z.enum(connectionColors),
});


type ConnectionForm = z.infer<typeof ConnectionFormSchema>;

export const formToConnectionStruct = (form: ConnectionForm) => {
  const { name, color, scheme, mode, ...rest } = form;

  switch (mode) {
    case ConnectionMode.Host: {
      const creds: HostCredentials = omit(rest, 'socket_path', 'file');
      return { name, scheme: { [scheme]: { [mode]: creds } }, color }
    }
    case ConnectionMode.Socket: {
      const creds: SocketCredentials = omit(rest, 'host', 'port', 'file');
      return { name, scheme: { [scheme]: { [mode]: creds } }, color }
    }
    case ConnectionMode.File: {
      const creds: FileCredentials = omit(rest, 'host', 'port', 'socket_path');
      return { name, scheme: { [scheme]: { [mode]: creds } } as Partial<Scheme>, color }
    }
  }
}

export * from './AddConnectionForm'

const defaultValues = {
  name: 'My Connection',
  scheme: Schemes.Mysql,
  port: 3306,
  color: 'orange',
  mode: AvailableConnectionModes[Schemes.Mysql][0],
  file: '',
  host: 'localhost',
  username: 'root',
  password: 'noir',
  dbname: 'noir',
}

const AddConnectionForm = (props: { addConnection: ({ name, scheme, color }: { name: string, scheme: Scheme, color: string }) => Promise<void> }) => {
  const { errorService: { addError } } = useAppSelector()
  const formHandler = useFormHandler(zodSchema(ConnectionFormSchema));
  const { formData, setFieldDefaultValue, getFormErrors, setFieldValue } = formHandler;

  onMount(() => {
    for (const key in defaultValues) {
      setFieldDefaultValue(key, defaultValues[key as keyof typeof defaultValues]);
    }
  });

  const submit = async (event: Event) => {
    event.preventDefault();
    await formHandler.validateForm().catch(() => { });
    try {
      const { name, scheme, color } = formToConnectionStruct(formData());
      await props.addConnection({ name, scheme, color });
    } catch (error) {
      console.error(error);
      addError((error as any).message);
    }
  };

  return (
    <div class="p-3 w-full flex justify-center items-around pt-20">
      <form class="flex max-w-lg flex-col gap-1" autocomplete="off" onSubmit={submit}>
        <div>
          <h2 class="text-2xl font-bold">{t('components.add_connection_form.title')}</h2>
        </div>
        <div class='grid grid-cols-5 gap-3'>
          <div class='col-span-3'>
            <TextInput
              label={t('components.add_connection_form.labels.name')}
              name="name" formHandler={formHandler}
              id="name" minLength={2} maxLength={255} />
          </div>
          <div class="col-span-2">
            <div class='w-full flex flex-col justify-stretch items-stretch'>
              <div class="flex items-end gap-3">
                <ColorCircle color={formData().color} />
                <Select
                  label={t('components.add_connection_form.labels.color')}
                  name="color"
                  class="w-full"
                  options={connectionColors.map((color) => ({ value: color, label: titleCase(color) }))}
                  formHandler={formHandler}
                />
              </div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-6 gap-3">
          <div class={formData().scheme === Schemes.Sqlite ? 'col-span-4' : 'col-span-2'}>
            <Select
              id="scheme"
              name="scheme"
              label={t('components.add_connection_form.labels.scheme')}
              options={schemes.map((sc) => ({ value: sc, label: titleCase(sc) }))}
              formHandler={formHandler}
              onChange={() => {
                setFieldValue('port', PORTS_MAP[formData().scheme] || 3306)
                if (formData().mode === ConnectionMode.Socket) {
                  setFieldValue('socket_path', SocketPathDefaults[formData().scheme])
                }
              }}
            />
          </div>
          <Show when={formData().scheme !== Schemes.Sqlite}>
            <div class='col-span-2'>
              <Select
                id="mode"
                name="mode"
                label={t('components.add_connection_form.labels.mode')}
                options={AvailableConnectionModes[formData().scheme].map((md) => ({ value: md, label: titleCase(md) }))}
                formHandler={formHandler}
                onChange={() => {
                  if (formData().mode === ConnectionMode.Socket) {
                    setFieldValue('socket_path', SocketPathDefaults[formData().scheme])
                  }
                }}
              />
            </div>
          </Show>
          <div class='col-span-2'>
            <Switch>
              <Match when={formData().scheme === Schemes.Sqlite}>
                <FileInput label={t('components.add_connection_form.labels.file')} formHandler={formHandler} name="file" />
              </Match>
              <Match when={formData().scheme !== Schemes.Sqlite}>
                <TextInput
                  label={t('components.add_connection_form.labels.dbname')}
                  min={1} max={255}
                  name="dbname" id="dbname" formHandler={formHandler} />
              </Match>
            </Switch>
          </div>
        </div>
        <Show when={formData().scheme !== Schemes.Sqlite}>
          <div class="grid grid-cols-6 gap-3">
            <Switch>
              <Match when={formData().mode === ConnectionMode.Host}>
                <div class='col-span-4'>
                  <TextInput
                    label={t('components.add_connection_form.labels.host')}
                    min={1} max={255}
                    name="host" id="host" formHandler={formHandler}
                  />
                </div>
                <div class='col-span-2'>
                  <TextInput
                    label={t('components.add_connection_form.labels.port')}
                    name="port" id="port" formHandler={formHandler} type="number"
                    min={1} max={65335} />
                </div>
              </Match>
              <Match when={formData().mode === ConnectionMode.Socket}>
                <div class='col-span-6'>
                  <TextInput
                    label={t('components.add_connection_form.labels.socket_path')}
                    min={1} max={255}
                    name="socket_path" id="socket_path" formHandler={formHandler}
                  />
                </div>
              </Match>
            </Switch>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class='w-full'>
              <TextInput
                label={t('components.add_connection_form.labels.username')}
                min={1} max={255}
                name="username" id="username" formHandler={formHandler} />
            </div>
            <div class='w-full'>
              <TextInput
                label={t('components.add_connection_form.labels.password')}
                name="password" id="password"
                min={1} max={255}
                formHandler={formHandler} type="password" />
            </div>
          </div>
        </Show>
        <div class="py-3">
          <Show when={Object.keys(getFormErrors()).length}>
            <Alert color="error">
              {getFormErrors().map((error) => (
                <p class="text-bold">
                  {t(`components.add_connection_form.labels.${error.path}`)}: {error.message}
                </p>
              ))}
            </Alert>
          </Show>
        </div>
        <div class="py-4">
          <button disabled={!!Object.keys(getFormErrors()).length} class="btn
            btn-primary btn-md btn-block" type="submit"
          >{t('components.add_connection_form.title')}</button>
        </div>
      </form >
    </div >
  )
}

export { AddConnectionForm }
