import * as z from 'zod';
import { validator } from '@felte/validator-zod';
import { t } from 'i18next';
import { createSignal, Match, Show, Switch } from 'solid-js';
import { createForm } from '@felte/solid';
import { TextInput, ColorCircle, Select, Alert, FilePicker, Label } from 'components/UI';
import {
  PORTS_MAP,
  Dialect,
  AvailableModes,
  SocketPathDefaults,
  connectionColors,
  Mode,
  dialects,
  DialectType,
  connectionModes,
  sslModes,
  SslMode,
} from 'interfaces';
import { useAppSelector } from 'services/Context';
import { invoke } from '@tauri-apps/api';
import { open, save } from '@tauri-apps/api/dialog';

const MIN_LENGTH_STR = 1;
const MAX_LENGTH_STR = 255;
const MAX_PORT = 65535;
const MIN_PORT = 1;

const messages = { length: t('add_connection_form.length_validation') };

const zstr = z.string().min(MIN_LENGTH_STR, messages.length).max(MAX_LENGTH_STR, messages.length);

const CredentialsSchema = z.union([
  z.object({
    host: zstr,
    user: zstr,
    password: zstr,
    db_name: zstr,
    port: z.union([z.string(), z.coerce.number().min(MIN_PORT).max(MAX_PORT)]).optional(),
    ssl_mode: z.enum(sslModes).optional(),
    ca_cert: zstr.optional(),
    client_cert: zstr.optional(),
    client_key: zstr.optional(),
  }),
  z.object({
    socket: zstr,
    user: zstr,
    password: zstr,
    db_name: zstr,
  }),
  z.object({
    path: zstr,
  }),
]);

const schema = z.object({
  name: zstr,
  dialect: z.enum(dialects),
  mode: z.enum(connectionModes),
  credentials: CredentialsSchema,
  color: z.enum(connectionColors),
});

type Form = z.infer<typeof schema>;
type Credentials = z.infer<typeof CredentialsSchema>;
type HostCredentials = Extract<Credentials, { host: string }>;

const defaultValues = {
  name: 'sasdad',
  dialect: Dialect.Postgresql,
  color: connectionColors[0],
  mode: AvailableModes[Dialect.Postgresql][0],
  credentials: {
    port: 5432,
    path: '',
    host: 'localhost',
    user: 'postgres',
    password: 'example',
    db_name: 'dvdrental',
    ssl_mode: SslMode.require,
    ca_cert: '/Users/michaelionov/p/noir/dev/certs/ca.pem',
    client_cert: '/Users/michaelionov/p/noir/dev/certs/client.pem',
    client_key: '/Users/michaelionov/p/noir/dev/certs/client.key',
  },
};

const AddConnectionForm = () => {
  const {
    connections: { addConnection },
    messages: { notify },
  } = useAppSelector();
  const [testing, setTesting] = createSignal(false);
  const [error, setError] = createSignal('');

  const testConnection = async () => {
    try {
      setTesting(true);
      const d = data();
      if ((d.credentials as HostCredentials).port) {
        (d.credentials as HostCredentials).port = String((d.credentials as HostCredentials).port);
      }
      console.log({ d });
      await invoke('test_connection', d);
      notify(t('add_connection_form.success', { name: d.name }), 'success');
      setError('');
    } catch (error) {
      setError(String(error));
    } finally {
      setTesting(false);
    }
  };

  const onSubmit = async (values: Form) => {
    try {
      if ((values.credentials as HostCredentials).port) {
        (values.credentials as HostCredentials).port = String((values.credentials as HostCredentials).port);
      }
      await addConnection(values);
      reset();
    } catch (error) {
      setError(String(error));
    }
  };

  const { form, setData, setFields, errors, data, isValid, isSubmitting, isDirty, reset } = createForm<Form>({
    onSubmit,
    initialValues: defaultValues,
    extend: validator({ schema }),
  });

  return (
    <div class="p-3 w-full flex justify-center items-around pt-20 rounded-tl-lg bg-base-100">
      <form use:form class="flex lg:w-[80%] xl:w-[60%] flex-col gap-1" autocomplete="off">
        <div>
          <h2 class="text-2xl font-bold">{t('add_connection_form.title')}</h2>
        </div>
        <div class="grid grid-cols-12 gap-2">
          <div
            classList={{
              'col-span-6': data('dialect') !== Dialect.Sqlite,
              'col-span-12': data('dialect') === Dialect.Sqlite,
            }}>
            <Select
              name="dialect"
              label={t('add_connection_form.labels.dialect')}
              options={dialects.map(String)}
              onChange={(e) => {
                if (data('mode') === Mode.Socket) {
                  setData('credentials.socket', SocketPathDefaults[data('dialect')]);
                }
                if (e.target.value === Dialect.Sqlite) {
                  setData('mode', Mode.File);
                } else {
                  setData('credentials.host', 'localhost');
                  setData('credentials.port', PORTS_MAP[data('dialect')] || 3306);
                  setData('mode', AvailableModes[e.target.value as DialectType][0]);
                }
              }}
            />
          </div>
          <Show when={data('dialect') !== Dialect.Sqlite}>
            <div class="col-span-6">
              <Select
                name="mode"
                label={t('add_connection_form.labels.mode')}
                options={AvailableModes[data('dialect')].map(String) ?? []}
                onChange={(e) => {
                  if (e.target.value === Mode.Socket) {
                    setData('credentials.socket', SocketPathDefaults[data('dialect')]);
                  } else if (e.target.value === Mode.Host) {
                    setData('credentials.host', 'localhost');
                    setData('credentials.port', PORTS_MAP[data('dialect')] || 3306);
                  }
                }}
              />
            </div>
          </Show>
          <Show when={data('dialect') === Dialect.Sqlite}>
            <div class="col-span-12">
              <div class="block">
                <Label label={t('add_connection_form.labels.path')} for="credentials.path" />
              </div>
              <FilePicker
                name="credentials.path"
                onClear={() => {
                  setFields('credentials.path', '');
                }}
                onCreate={async () => {
                  const path = await save({ title: 'Select database location' });
                  if (!path) return;
                  setFields('credentials.path', path + '.db');
                }}
                onChange={async () => {
                  const path = (await open({ multiple: false, title: 'Select sqlite file' })) as string;
                  if (!path) return;
                  setFields('credentials.path', path);
                }}
              />
            </div>
          </Show>
          <Show when={data('dialect') !== Dialect.Sqlite}>
            <Switch>
              <Match when={data('mode') === Mode.Host}>
                <div class="col-span-6">
                  <TextInput
                    label={t('add_connection_form.labels.host')}
                    errors={errors('credentials.host')}
                    name="credentials.host"
                  />
                </div>
                <div class="col-span-3">
                  <TextInput
                    label={t('add_connection_form.labels.port')}
                    errors={errors('credentials.port')}
                    name="credentials.port"
                    type="number"
                    min={1}
                    max={65335}
                  />
                </div>
                <div class="col-span-3">
                  <Select label={t('add_connection_form.labels.host')} name="credentials.ssl_mode" options={sslModes.map(String)} />
                </div>
              </Match>
              <Match when={data('mode') === Mode.Socket}>
                <div class="col-span-12">
                  <TextInput
                    label={t('add_connection_form.labels.socket')}
                    errors={errors('credentials.socket')}
                    name="credentials.socket"
                  />
                </div>
              </Match>
            </Switch>
            <div class="col-span-4">
              <TextInput
                label={t('add_connection_form.labels.user')}
                errors={errors('credentials.user')}
                name="credentials.user"
              />
            </div>
            <div class="col-span-4">
              <TextInput
                label={t('add_connection_form.labels.password')}
                errors={errors('credentials.password')}
                name="credentials.password"
                type="password"
              />
            </div>
            <Show when={data('dialect') !== Dialect.Sqlite}>
              <div class="col-span-4">
                <TextInput
                  label={t('add_connection_form.labels.db_name')}
                  errors={errors('credentials.db_name')}
                  name="credentials.db_name"
                />
              </div>
            </Show>
            <Show when={data('mode') === Mode.Host}>
              <div class="col-span-12">
                <div class="block">
                  <Label label={t('add_connection_form.labels.ca_cert')} for="credentials.ca_cert" />
                </div>
                <FilePicker
                  name="credentials.ca_cert"
                  onClear={() => {
                    setFields('credentials.ca_cert', '');
                  }}
                  onChange={async () => {
                    const path = (await open({
                      multiple: false,
                      title: t('add_connection_form.select_file'),
                    })) as string;
                    if (!path) return;
                    setFields('credentials.ca_cert', path);
                  }}
                />
              </div>
              <div class="col-span-12">
                <div class="block">
                  <Label label={t('add_connection_form.labels.client_cert')} for="credentials.client_cert" />
                </div>
                <FilePicker
                  name="credentials.client_cert"
                  onClear={() => {
                    setFields('credentials.client_cert', '');
                  }}
                  onChange={async () => {
                    const path = (await open({
                      multiple: false,
                      title: t('add_connection_form.select_file'),
                    })) as string;
                    if (!path) return;
                    setFields('credentials.client_cert', path);
                  }}
                />
              </div>
              <div class="col-span-12">
                <div class="block">
                  <Label label={t('add_connection_form.labels.client_key')} for="credentials.client_key" />
                </div>
                <FilePicker
                  name="credentials.client_key"
                  onClear={() => {
                    setFields('credentials.client_key', '');
                  }}
                  onChange={async () => {
                    const path = (await open({
                      multiple: false,
                      title: t('add_connection_form.select_file'),
                    })) as string;
                    if (!path) return;
                    setFields('credentials.client_key', path);
                  }}
                />
              </div>
            </Show>
            <div class="col-span-8">
              <TextInput label={t('add_connection_form.labels.name')} errors={errors('name')} name="name" />
            </div>
            <div class="col-span-4">
              <div class="flex items-end">
                <Select
                  name="color"
                  label={t('add_connection_form.labels.color')}
                  options={connectionColors.map(String)}
                />
                <ColorCircle color={data('color')} />
              </div>
            </div>
          </Show>
        </div>
        <div class="py-3 min-h-[80px]">
          <Show when={error()}>
            <Alert color="error">
              <p class="text-bold">{error()}</p>
            </Alert>
          </Show>
        </div>
        <div class="py-4 flex items-center justify-end">
          <div class="gap-4 flex">
            <button
              class="btn btn-accent btn-sm"
              type="button"
              onClick={testConnection}
              disabled={!isValid() || testing() || !isDirty()}>
              <Show when={testing()}>
                <span class="loading loading-spinner"></span>
              </Show>
              {t('add_connection_form.test')}
            </button>
            <button disabled={isSubmitting() || !isValid() || !isDirty()} class="btn btn-primary btn-sm" type="submit">
              <Show when={isSubmitting()}>
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
