import { z } from 'zod';
import { validator } from '@felte/validator-zod';
import { t } from 'i18next';
import { createSignal, Match, Show, Switch } from 'solid-js';
import { createForm } from '@felte/solid';
import { ColorCircle } from 'components/ui/color-circle';
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
  ModeType,
} from 'interfaces';
import { useAppSelector } from 'services/Context';
import { invoke } from '@tauri-apps/api';
import { open, save } from '@tauri-apps/api/dialog';
import { FilePicker } from 'components/ui/file-picker';
import { Label } from 'components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select';
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldLabel,
  TextFieldRoot,
} from 'components/ui/textfield';
import { Alert, AlertDescription, AlertTitle } from 'components/ui/alert';
import { BiSolidError } from 'solid-icons/bi';
import {
  Checkbox,
  CheckboxControl,
  CheckboxLabel,
} from 'components/ui/checkbox';
import { Button } from 'components/ui/button';
import { toast } from 'solid-sonner';

const MIN_LENGTH_STR = 1;
const MAX_LENGTH_STR = 255;
const MAX_PORT = 65535;
const MIN_PORT = 1;

const messages = { length: t('add_connection_form.length_validation') };

const zstr = z
  .string()
  .min(MIN_LENGTH_STR, messages.length)
  .max(MAX_LENGTH_STR, messages.length);

const CredentialsSchema = z.union([
  z.object({
    host: zstr,
    user: zstr,
    password: zstr,
    db_name: zstr,
    port: z
      .union([z.string(), z.coerce.number().min(MIN_PORT).max(MAX_PORT)])
      .optional(),
    ssl_mode: z.enum(sslModes).default(SslMode.prefer).optional(),
    ca_cert: zstr.optional().or(z.literal('')),
    client_cert: zstr.optional().or(z.literal('')),
    client_key: zstr.optional().or(z.literal('')),
    ssh_host: zstr,
    ssh_user: zstr,
    ssh_key: zstr.optional().or(z.literal('')),
    ssh_port: z
      .union([z.string(), z.coerce.number().min(MIN_PORT).max(MAX_PORT)])
      .default('22')
      .optional(),
  }),
  z.object({
    host: zstr.default('localhost'),
    user: zstr,
    password: zstr,
    db_name: zstr,
    port: z
      .union([z.string(), z.coerce.number().min(MIN_PORT).max(MAX_PORT)])
      .default('5432')
      .optional(),
    ssl_mode: z.enum(sslModes).default(SslMode.prefer).optional(),
    ca_cert: zstr.optional().or(z.literal('')),
    client_cert: zstr.optional().or(z.literal('')),
    client_key: zstr.optional().or(z.literal('')),
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
  mode: z.enum(connectionModes).default(connectionModes[0]),
  credentials: CredentialsSchema,
  color: z.enum(connectionColors),
});

type Form = z.infer<typeof schema>;
type Credentials = z.infer<typeof CredentialsSchema>;
type HostCredentials = Extract<Credentials, { host: string }>;
type SshCredentials = Extract<Credentials, { ssh_host: string }>;

const defaultValues = {
  name: '',
  dialect: Dialect.Postgresql,
  color: connectionColors[0],
  mode: AvailableModes[Dialect.Postgresql][0],
  credentials: {
    port: 5432,
    host: 'localhost',
    ssl_mode: SslMode.prefer,
  },
};

const normalize = (values: Form) => {
  if (values.mode === Mode.Host) {
    (values.credentials as HostCredentials).port = String(
      (values.credentials as HostCredentials).port
    );
  }
  if (values.mode === Mode.Ssh) {
    (values.credentials as HostCredentials).port = String(
      (values.credentials as HostCredentials).port
    );
    (values.credentials as SshCredentials).ssh_port = String(
      (values.credentials as SshCredentials).ssh_port
    );
  }
  if (!values.mode && values.dialect === Dialect.Sqlite) {
    values.mode = Mode.File;
  }
  return values;
};

type AddConnectionFormProps = {
  onClose: () => void;
};

const AddConnectionForm = (props: AddConnectionFormProps) => {
  const {
    connections: { addConnection },
  } = useAppSelector();
  const [testing, setTesting] = createSignal(false);
  const [error, setError] = createSignal('');
  const [showCerts, setShowCerts] = createSignal(false);

  const testConnection = async () => {
    try {
      setTesting(true);
      const values = data();
      await invoke('test_connection', normalize(values));
      toast.success(t('add_connection_form.success'));
      setError('');
    } catch (error) {
      setError(String(error));
    } finally {
      setTesting(false);
    }
  };

  const onSubmit = async (values: Form) => {
    try {
      await addConnection(normalize(values));
      reset();
      props.onClose();
    } catch (error) {
      setError(String(error));
    }
  };

  const {
    form,
    setFields,
    errors,
    data,
    isValid,
    isSubmitting,
    isDirty,
    reset,
  } = createForm<Form>({
    onSubmit,
    initialValues: defaultValues,
    extend: validator({ schema }),
  });
  form; // ts-server - stfu

  return (
    <div class="w-full flex justify-center items-around">
      <form use:form class="flex w-full flex-col gap-1" autocomplete="off">
        <div>
          <h2 class="text-2xl font-bold">{t('add_connection_form.title')}</h2>
        </div>
        <div class="grid grid-cols-12 gap-2">
          <div
            classList={{
              'col-span-6': data('dialect') !== Dialect.Sqlite,
              'col-span-12': data('dialect') === Dialect.Sqlite,
            }}
          >
            <Label>{t('add_connection_form.labels.dialect')}</Label>
            <Select
              class="w-full"
              options={dialects.map(String)}
              onChange={(value) => {
                const dialect = value as DialectType;
                setFields('dialect', dialect);
                if (data('mode') === Mode.Socket) {
                  setFields(
                    'credentials.socket',
                    SocketPathDefaults[data('dialect')]
                  );
                }
                if (dialect === Dialect.Sqlite) {
                  setFields('mode', Mode.File);
                } else {
                  setFields('credentials.host', 'localhost');
                  setFields('credentials.port', PORTS_MAP[dialect] || 3306);
                  setFields('mode', AvailableModes[value as DialectType][0]);
                }
              }}
              value={data('dialect')}
              name="dialect"
              itemComponent={(props) => (
                <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
              )}
            >
              <SelectTrigger class="h-8 w-full">
                <SelectValue>
                  {(state) => state.selectedOption() as string}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
          <Show when={data('dialect') !== Dialect.Sqlite}>
            <div class="col-span-6">
              <Label>{t('add_connection_form.labels.mode')}</Label>
              <Select
                class="w-full"
                options={AvailableModes[data('dialect')].map(String) ?? []}
                onChange={(value) => {
                  setFields('mode', value as ModeType);
                  if (value === Mode.Socket) {
                    setFields(
                      'credentials.socket',
                      SocketPathDefaults[data('dialect')]
                    );
                  } else if (value === Mode.Host) {
                    setFields('credentials.host', 'localhost');
                    setFields(
                      'credentials.port',
                      PORTS_MAP[data('dialect')] || 3306
                    );
                    setFields('credentials.ssl_mode', SslMode.prefer);
                  }
                }}
                value={data('mode')}
                name="mode"
                itemComponent={(props) => (
                  <SelectItem item={props.item}>
                    {props.item.rawValue}
                  </SelectItem>
                )}
              >
                <SelectTrigger class="h-8 w-full">
                  <SelectValue>
                    {(state) => state.selectedOption() as string}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
          </Show>
          <Show when={data('dialect') === Dialect.Sqlite}>
            <div class="col-span-12">
              <div class="block">
                <Label>{t('add_connection_form.labels.path')}</Label>
              </div>
              <FilePicker
                name="credentials.path"
                onClear={() => {
                  setFields('credentials.path', '');
                }}
                onCreate={async () => {
                  const path = await save({
                    title: 'Select database location',
                  });
                  if (!path) return;
                  setFields('credentials.path', path + '.db');
                }}
                onChange={async () => {
                  const path = (await open({
                    multiple: false,
                    title: 'Select sqlite file',
                  })) as string;
                  if (!path) return;
                  setFields('credentials.path', path);
                }}
              />
            </div>
          </Show>
          <Show when={data('dialect') !== Dialect.Sqlite}>
            <Switch>
              <Match when={[Mode.Host, Mode.Ssh].includes(data('mode'))}>
                <Show when={data('mode') === Mode.Ssh}>
                  <div class="col-span-6">
                    <TextFieldRoot class="w-full" name="credentials.ssh_host">
                      <TextFieldLabel>
                        {t('add_connection_form.labels.ssh_host')}
                      </TextFieldLabel>
                      <TextField
                        name="credentials.ssh_host"
                        size="sm"
                        class="h-8"
                      />
                      <TextFieldErrorMessage>
                        {errors('credentials.ssh_host')}
                      </TextFieldErrorMessage>
                    </TextFieldRoot>
                  </div>
                  <div class="col-span-3">
                    <TextFieldRoot class="w-full" name="credentials.ssh_port">
                      <TextFieldLabel>
                        {t('add_connection_form.labels.ssh_port')}
                      </TextFieldLabel>
                      <TextField
                        type="number"
                        min={1}
                        required={false}
                        max={65335}
                        name="credentials.ssh_port"
                        size="sm"
                        class="h-8"
                      />
                      <TextFieldErrorMessage>
                        {errors('credentials.ssh_port')}
                      </TextFieldErrorMessage>
                    </TextFieldRoot>
                  </div>
                  <div class="col-span-3">
                    <TextFieldRoot class="w-full" name="credentials.ssh_user">
                      <TextFieldLabel>
                        {t('add_connection_form.labels.ssh_user')}
                      </TextFieldLabel>
                      <TextField
                        name="credentials.ssh_user"
                        size="sm"
                        class="h-8"
                      />
                      <TextFieldErrorMessage>
                        {errors('credentials.ssh_port')}
                      </TextFieldErrorMessage>
                    </TextFieldRoot>
                  </div>
                  <div class="col-span-12">
                    <div class="block">
                      <Label>{t('add_connection_form.labels.ssh_key')}</Label>
                    </div>
                    <FilePicker
                      name="credentials.ssh_key"
                      onClear={() => {
                        setFields('credentials.ssh_key', '');
                      }}
                      onChange={async () => {
                        const path = (await open({
                          multiple: false,
                          title: t('add_connection_form.select_file'),
                        })) as string;
                        if (!path) return;
                        setFields('credentials.ssh_key', path);
                      }}
                    />
                  </div>
                </Show>
                <div class="col-span-6">
                  <TextFieldRoot class="w-full" name="credentials.host">
                    <TextFieldLabel>
                      {t('add_connection_form.labels.host')}
                    </TextFieldLabel>
                    <TextField name="credentials.host" size="sm" class="h-8" />
                    <TextFieldErrorMessage>
                      {errors('credentials.host')}
                    </TextFieldErrorMessage>
                  </TextFieldRoot>
                </div>
                <div class="col-span-3">
                  <TextFieldRoot class="w-full" name="credentials.port">
                    <TextFieldLabel>
                      {t('add_connection_form.labels.port')}
                    </TextFieldLabel>
                    <TextField
                      type="number"
                      min={1}
                      max={65335}
                      name="credentials.port"
                      size="sm"
                      class="h-8"
                    />
                    <TextFieldErrorMessage>
                      {errors('credentials.port')}
                    </TextFieldErrorMessage>
                  </TextFieldRoot>
                </div>
                <div class="col-span-3 space-y-1">
                  <Label>{t('add_connection_form.labels.ssl_mode')}</Label>
                  <Select
                    class="w-full"
                    options={sslModes.map(String)}
                    value={data('credentials.ssl_mode')}
                    name="credentials.ssl_mode"
                    onChange={(value) => {
                      setFields('credentials.ssl_mode', value);
                    }}
                    itemComponent={(props) => (
                      <SelectItem item={props.item}>
                        {props.item.rawValue}
                      </SelectItem>
                    )}
                  >
                    <SelectTrigger class="h-8 w-full">
                      <SelectValue>
                        {(state) => state.selectedOption() as string}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </div>
              </Match>
              <Match when={data('mode') === Mode.Socket}>
                <div class="col-span-12">
                  <TextFieldRoot class="w-full" name="credentials.socket">
                    <TextFieldLabel>
                      {t('add_connection_form.labels.socket')}
                    </TextFieldLabel>
                    <TextField
                      name="credentials.socket"
                      size="sm"
                      class="h-8"
                    />
                    <TextFieldErrorMessage>
                      {errors('credentials.port')}
                    </TextFieldErrorMessage>
                  </TextFieldRoot>
                </div>
              </Match>
            </Switch>
            <div class="col-span-4">
              <TextFieldRoot class="w-full" name="credentials.user">
                <TextFieldLabel>
                  {t('add_connection_form.labels.user')}
                </TextFieldLabel>
                <TextField name="credentials.user" size="sm" class="h-8" />
                <TextFieldErrorMessage>
                  {errors('credentials.port')}
                </TextFieldErrorMessage>
              </TextFieldRoot>
            </div>
            <div class="col-span-4">
              <TextFieldRoot class="w-full" name="credentials.password">
                <TextFieldLabel>
                  {t('add_connection_form.labels.password')}
                </TextFieldLabel>
                <TextField
                  name="credentials.password"
                  type="password"
                  size="sm"
                  class="h-8"
                />
                <TextFieldErrorMessage>
                  {errors('credentials.password')}
                </TextFieldErrorMessage>
              </TextFieldRoot>
            </div>
            <Show when={data('dialect') !== Dialect.Sqlite}>
              <div class="col-span-4">
                <TextFieldRoot class="w-full" name="credentials.db_name">
                  <TextFieldLabel>
                    {t('add_connection_form.labels.db_name')}
                  </TextFieldLabel>
                  <TextField name="credentials.db_name" size="sm" class="h-8" />
                  <TextFieldErrorMessage>
                    {errors('credentials.db_name')}
                  </TextFieldErrorMessage>
                </TextFieldRoot>
              </div>
            </Show>
          </Show>
          <div class="col-span-8">
            <TextFieldRoot class="w-full" name="name">
              <TextFieldLabel>
                {t('add_connection_form.labels.name')}
              </TextFieldLabel>
              <TextField name="name" size="sm" class="h-8" />
              <TextFieldErrorMessage>{errors('name')}</TextFieldErrorMessage>
            </TextFieldRoot>
          </div>
          <div class="col-span-4">
            <Label>{t('add_connection_form.labels.color')}</Label>
            <div class="flex items-end space-y-1">
              <Select
                class="w-full"
                options={connectionColors.map(String)}
                value={data('color')}
                onChange={(value) => {
                  setFields(
                    'color',
                    value as (typeof connectionColors)[number]
                  );
                }}
                name="color"
                itemComponent={(props) => (
                  <SelectItem item={props.item}>
                    {props.item.rawValue}
                  </SelectItem>
                )}
              >
                <SelectTrigger class="h-8 w-full">
                  <SelectValue>
                    {(state) => state.selectedOption() as string}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent class="max-h-48 overflow-auto" />
              </Select>
              <ColorCircle color={data('color')} />
            </div>
          </div>
          <Show
            when={
              data('mode') === Mode.Host &&
              data('credentials.ssl_mode') !== SslMode.disable
            }
          >
            <div class="col-span-12 py-1">
              <Checkbox
                checked={showCerts()}
                onChange={(e) => setShowCerts(e)}
                class="flex items-center gap-2"
              >
                <CheckboxControl class="rounded-md border-accent" />
                <div class="grid gap-1.5 leading-none">
                  <CheckboxLabel class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t('add_connection_form.labels.show_ssl_certs')}
                  </CheckboxLabel>
                </div>
              </Checkbox>
            </div>
          </Show>
          <Show
            when={
              data('mode') === Mode.Host &&
              data('credentials.ssl_mode') !== SslMode.disable &&
              showCerts()
            }
          >
            <div class="col-span-12">
              <div class="block">
                <Label>{t('add_connection_form.labels.ca_cert')}</Label>
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
            <Show when={data('dialect') !== Dialect.Sqlite}>
              <div class="col-span-12">
                <div class="block">
                  <Label>{t('add_connection_form.labels.client_cert')} </Label>
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
            </Show>
            <Show when={data('dialect') !== Dialect.Sqlite}>
              <div class="col-span-12">
                <div class="block">
                  <Label>{t('add_connection_form.labels.client_key')}</Label>
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
          </Show>
        </div>
        <div class="py-3 min-h-[80px]">
          <Show when={error()}>
            <Alert variant="destructive">
              <BiSolidError class="h-4 w-4" />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>{error()}</AlertDescription>
            </Alert>
          </Show>
        </div>
        <div class="py-4 flex items-center justify-end">
          <div class="gap-4 flex">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={testConnection}
              disabled={!isValid() || testing() || !isDirty()}
            >
              <Show when={testing()}>
                <span class="loading loading-spinner"></span>
              </Show>
              {t('add_connection_form.test')}
            </Button>
            <Button
              disabled={isSubmitting() || !isValid() || !isDirty()}
              size="sm"
              type="submit"
            >
              <Show when={isSubmitting()}>
                <span class="loading loading-spinner"></span>
              </Show>
              {t('add_connection_form.title')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export { AddConnectionForm };
