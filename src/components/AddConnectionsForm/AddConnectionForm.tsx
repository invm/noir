import { Alert, Button, Checkbox, TextInput, Select } from '../UI';
import { ConnectionFormSchema } from '.';
import { ConnectionColor, connectionColors, PORTS_MAP, Schemes, SchemeType, schemes, connectionModes, AvailableConnectionModes } from '../../interfaces';
import { titleCase } from '../../utils/formatters';
import { useFormHandler } from 'solid-form-handler';
import { zodSchema } from 'solid-form-handler/zod';
import { t } from 'i18next';
import { createEffect, Match, onMount, Show, Switch } from 'solid-js';
import { FileInput } from '../UI/FileInput';

const ColorCircle = (props: { color: ConnectionColor }) => {
  return <span class={`min-w-[20px] min-h-[20px] mb-1 rounded-full border-2 bg-${props.color}-500`}></span>
}

const defaultValues = {
  connection_name: '',
  scheme: Schemes.MySQL,
  port: 3306,
  color: 'orange',
  mode: AvailableConnectionModes[Schemes.MySQL][0],
  host: '',
  username: '',
  password: '',
  save_password: false,
  dbname: '',
  params: '',
}

const AddConnectionForm = () => {
  const formHandler = useFormHandler(zodSchema(ConnectionFormSchema), {
    delay: 300,
  });
  const { formData, isFormInvalid, setFieldDefaultValue, getFormErrors, setFieldValue, formHasChanges } = formHandler;

  onMount(() => {
    for (const key in defaultValues) {
      setFieldDefaultValue(key, defaultValues[key as keyof typeof defaultValues]);
    }
  });

  const submit = async (event: Event) => {
    console.log(formData())
    event.preventDefault();
    try {
      await formHandler.validateForm();
      alert('Data sent with success: ' + JSON.stringify(formData()));
      formHandler.resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  createEffect(() => {
    console.log("scheme changed", formData().scheme)
  })

  return (
    <div class="flex-2 p-3 max-w-lg">
      <form class="flex w-full flex-col gap-1" autocomplete="off" onSubmit={submit}>
        <div>
          <h2 class="text-2xl font-bold text">{t('components.add_connection_form.title')}</h2>
        </div>
        <div class='grid grid-cols-5 gap-3'>
          <div class='col-span-3'>
            <TextInput
              label={t('components.add_connection_form.labels.connection_name')}
              name="connection_name" formHandler={formHandler}
              id="connection_name" minLength={2} maxLength={255} />
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
          <div class={formData().scheme === Schemes.SQLite ? 'col-span-6' : 'col-span-2'}>
            <Select
              id="scheme"
              name="scheme"
              label={t('components.add_connection_form.labels.scheme')}
              options={schemes.map((sc) => ({ value: sc, label: titleCase(sc) }))}
              formHandler={formHandler}
              onChange={(e) => {
                setFieldValue('port', PORTS_MAP[e.target.value as SchemeType] || 3306)
              }}
            />
          </div>
          <Show when={formData().scheme !== Schemes.SQLite}>
            <div class='col-span-2'>
              <Select
                id="mode"
                name="mode"
                label={t('components.add_connection_form.labels.mode')}
                options={AvailableConnectionModes[formData().scheme].map((md) => ({ value: md, label: titleCase(md) }))}
                formHandler={formHandler}
                onChange={(e) => {
                  setFieldValue('port', PORTS_MAP[e.target.value as SchemeType] || 3306)
                }}
              />
            </div>
          </Show>
          <Show when={formData().scheme !== Schemes.SQLite}>
            <div class='col-span-2'>
              <TextInput
                label={t('components.add_connection_form.labels.dbname')}
                min={1} max={255}
                name="dbname" id="dbname" formHandler={formHandler} />
            </div>
          </Show>
        </div>
        <div class="grid grid-cols-6 gap-3">
          <div class='col-span-4'>
            <Switch fallback={<div>Not Found</div>}>
              <Match when={formData().scheme === Schemes.SQLite}>
                <FileInput label={t('components.add_connection_form.labels.file')} formHandler={formHandler} name="file" />
              </Match>
              <Match when={formData().scheme !== Schemes.SQLite}>
                <TextInput
                  label={t('components.add_connection_form.labels.host')}
                  min={1} max={255}
                  name="host" id="host" formHandler={formHandler}
                />
              </Match>
            </Switch>
          </div>
          <Show when={formData().scheme !== Schemes.SQLite}>
            <div class='col-span-2'>
              <TextInput
                label={t('components.add_connection_form.labels.port')}
                name="port" id="port" formHandler={formHandler} type="number"
                min={1} max={65335} />
            </div>
          </Show>
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
        <div class="flex items-center gap-2 my-2">
          <Checkbox name="save_password" label={t('components.add_connection_form.labels.save_password')} id="save_password" formHandler={formHandler} />
        </div>
        <Show when={Object.keys(getFormErrors()).length}>
          <Alert color="error">
            {getFormErrors().map((error) => (
              <p class="text-bold">
                {t(`components.add_connection_form.labels.${error.path}`)}: {error.message}
              </p>
            ))}
          </Alert>
        </Show>
        <Button type="submit" >{t('components.add_connection_form.title')}</Button>
      </form >
    </div >
  )
}

export { AddConnectionForm }
