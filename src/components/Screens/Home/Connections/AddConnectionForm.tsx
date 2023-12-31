import * as z from 'zod';
import { useFormHandler } from 'solid-form-handler';
import { zodSchema } from 'solid-form-handler/zod';
import { t } from 'i18next';
import { createSignal, Match, onMount, Show, Switch } from 'solid-js';

import { Alert, TextInput, Select, ColorCircle, FileInput } from 'components/UI';
import {
  PORTS_MAP,
  Dialect,
  AvailableModes,
  SocketPathDefaults,
  connectionColors,
  Mode,
  connectionModes,
  dialects,
} from 'interfaces';
import { titleCase } from 'utils/formatters';
import { useAppSelector } from 'services/Context';
import { invoke } from '@tauri-apps/api';

const MIN_LENGTH_STR = 2;
const MAX_LENGTH_STR = 255;
const MAX_PORT = 65535;
const MIN_PORT = 1;

const messages = {
  length: t('add_connection_form.length_validation'),
};

export const ConnectionFormSchema = z.object({
  name: z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length),
  dialect: z.enum(dialects),
  mode: z.enum(connectionModes),
  user: z
    .string()
    .min(MIN_LENGTH_STR, messages.length)
    .max(MAX_LENGTH_STR, messages.length)
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(MIN_LENGTH_STR, messages.length)
    .max(MAX_LENGTH_STR, messages.length)
    .optional()
    .or(z.literal('')),
  host: z
    .string()
    .min(MIN_LENGTH_STR, messages.length)
    .max(MAX_LENGTH_STR, messages.length)
    .optional()
    .or(z.literal('')),
  file: z
    .string()
    .min(MIN_LENGTH_STR, messages.length)
    .max(MAX_LENGTH_STR, messages.length)
    .optional()
    .or(z.literal('')),
  socket: z
    .string()
    .min(MIN_LENGTH_STR, messages.length)
    .max(MAX_LENGTH_STR, messages.length)
    .optional()
    .or(z.literal('')),
  port: z.coerce.number().min(MIN_PORT).max(MAX_PORT).optional(),
  db_name: z.string().optional().or(z.literal('')),
  color: z.enum(connectionColors),
});

type ConnectionForm = z.infer<typeof ConnectionFormSchema>;

export const formToConnectionStruct = (form: ConnectionForm) => {
  const { name, color, dialect, mode, socket, file, ...credentials } = form;

  return {
    name,
    color,
    dialect,
    mode,
    credentials: {
      ...credentials,
      port: String(credentials.port),
      ...(mode === Mode.Socket ? { socket } : {}),
      ...(dialect === Dialect.Sqlite ? { file } : {}),
    },
  };
};

export * from './AddConnectionForm';

const defaultValues = {
  name: 'Local',
  dialect: Dialect.Mysql,
  port: 3306,
  color: 'cyan',
  mode: AvailableModes[Dialect.Mysql][0],
  file: '',
  host: 'localhost',
  user: 'root',
  password: 'localR00t!',
  db_name: 'dev_NAME',
};

const AddConnectionForm = () => {
  const {
    connections: { addConnection },
    messages: { notify },
  } = useAppSelector();
  const [testing, setTesting] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const formHandler = useFormHandler(zodSchema(ConnectionFormSchema));
  const { formData, setFieldDefaultValue, getFormErrors, setFieldValue } = formHandler;

  onMount(() => {
    for (const key in defaultValues) {
      setFieldDefaultValue(key, defaultValues[key as keyof typeof defaultValues]);
    }
  });

  const testConnection = async () => {
    try {
      setTesting(true);
      await invoke('test_connection', formToConnectionStruct(formData()));
      const name = formData().db_name;
      notify(t('add_connection_form.success', { name }), 'success');
    } catch (error) {
      notify(error);
    } finally {
      setTesting(false);
    }
  };

  const submit = async (event: Event) => {
    try {
      setLoading(true);
      event.preventDefault();
      await formHandler.validateForm();
      await addConnection(formToConnectionStruct(formData()));
    } catch (error) {
      notify(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="p-3 w-full flex justify-center items-around pt-20 rounded-tl-lg bg-base-100">
      <form class="flex max-w-lg flex-col gap-1" autocomplete="off" onSubmit={submit}>
        <div>
          <h2 class="text-2xl font-bold">{t('add_connection_form.title')}</h2>
        </div>
        <div class="grid grid-cols-6 gap-3">
          <div class={formData().dialect === Dialect.Sqlite ? 'col-span-4' : 'col-span-2'}>
            <Select
              id="dialect"
              name="dialect"
              label={t('add_connection_form.labels.dialect')}
              options={dialects.map((sc) => ({
                value: sc,
                label: titleCase(sc),
              }))}
              formHandler={formHandler}
              onChange={() => {
                setFieldValue('port', PORTS_MAP[formData().dialect] || 3306);
                if (formData().mode === Mode.Socket) {
                  setFieldValue('socket', SocketPathDefaults[formData().dialect]);
                }
              }}
            />
          </div>
          <Show when={formData().dialect !== Dialect.Sqlite}>
            <div class="col-span-2">
              <Select
                id="mode"
                name="mode"
                label={t('add_connection_form.labels.mode')}
                options={AvailableModes[formData()?.dialect].map((md) => ({ value: md, label: titleCase(md) }))}
                formHandler={formHandler}
                onChange={() => {
                  if (formData().mode === Mode.Socket) {
                    setFieldValue('socket', SocketPathDefaults[formData().dialect]);
                  }
                }}
              />
            </div>
          </Show>
          <div class="col-span-2">
            <Switch>
              <Match when={formData().dialect === Dialect.Sqlite}>
                <FileInput label={t('add_connection_form.labels.file')} formHandler={formHandler} name="file" />
              </Match>
              <Match when={formData().dialect !== Dialect.Sqlite}>
                <TextInput
                  label={t('add_connection_form.labels.db_name')}
                  min={1}
                  max={255}
                  name="db_name"
                  id="db_name"
                  formHandler={formHandler}
                />
              </Match>
            </Switch>
          </div>
        </div>
        <Show when={formData().dialect !== Dialect.Sqlite}>
          <div class="grid grid-cols-6 gap-3">
            <Switch>
              <Match when={formData().mode === Mode.Host}>
                <div class="col-span-4">
                  <TextInput
                    label={t('add_connection_form.labels.host')}
                    autocapitalize="off"
                    min={1}
                    max={255}
                    name="host"
                    id="host"
                    formHandler={formHandler}
                  />
                </div>
                <div class="col-span-2">
                  <TextInput
                    label={t('add_connection_form.labels.port')}
                    autocapitalize="off"
                    name="port"
                    id="port"
                    formHandler={formHandler}
                    type="number"
                    min={1}
                    max={65335}
                  />
                </div>
              </Match>
              <Match when={formData().mode === Mode.Socket}>
                <div class="col-span-6">
                  <TextInput
                    label={t('add_connection_form.labels.socket')}
                    autocapitalize="off"
                    min={1}
                    max={255}
                    name="socket"
                    id="socket"
                    formHandler={formHandler}
                  />
                </div>
              </Match>
            </Switch>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="w-full">
              <TextInput
                label={t('add_connection_form.labels.user')}
                autocapitalize="off"
                min={1}
                max={255}
                name="user"
                id="user"
                formHandler={formHandler}
              />
            </div>
            <div class="w-full">
              <TextInput
                label={t('add_connection_form.labels.password')}
                autocapitalize="off"
                name="password"
                id="password"
                min={1}
                max={255}
                formHandler={formHandler}
                type="password"
              />
            </div>
          </div>

          <div class="grid grid-cols-5 gap-3">
            <div class="col-span-3">
              <TextInput
                label={t('add_connection_form.labels.name')}
                name="name"
                autocapitalize="off"
                formHandler={formHandler}
                id="name"
                minLength={2}
                maxLength={255}
              />
            </div>
            <div class="col-span-2">
              <div class="w-full flex flex-col justify-stretch items-stretch">
                <div class="flex items-end gap-3">
                  <ColorCircle color={formData().color} />
                  <Select
                    label={t('add_connection_form.labels.color')}
                    name="color"
                    class="w-full"
                    options={connectionColors.map((color) => ({
                      value: color,
                      label: titleCase(color),
                    }))}
                    formHandler={formHandler}
                  />
                </div>
              </div>
            </div>
          </div>
        </Show>
        <div class="py-3 h-[50px]">
          <Show when={Object.keys(getFormErrors()).length}>
            <Alert color="error">
              {getFormErrors().map((error) => (
                <p class="text-bold">
                  {t(`add_connection_form.labels.${error.path}`)}: {error.message}
                </p>
              ))}
            </Alert>
          </Show>
        </div>
        <div class="py-4 flex items-center justify-end">
          <div class="gap-4 flex">
            <button
              class="btn btn-secondary btn-sm"
              onClick={testConnection}
              disabled={!!Object.keys(getFormErrors()).length || testing()}>
              <Show when={testing()}>
                <span class="loading loading-spinner"></span>
              </Show>
              {t('add_connection_form.test')}
            </button>
            <button
              disabled={!!Object.keys(getFormErrors()).length || loading()}
              class="btn
            btn-primary btn-sm"
              type="submit">
              <Show when={loading()}>
                <span class="loading loading-spinner"></span>
              </Show>
              {t('add_connection_form.title')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export { AddConnectionForm };
