import { Button, Checkbox, Label, TextInput, Select, Dropdown } from 'flowbite-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ConnectionFormInput, ConnectionFormSchema } from '.';
import { ConnectionColor, connectionColors, Scheme, schemes } from '../../interfaces';
import { titleCase } from '../../utils/formatters';

const ColorCircle = ({ color }: { color: ConnectionColor }) => {
  return <span style={{ width: 20, height: 20, borderRadius: '50%', margin: 8 }} className={`bg-${color}-500`}></span>
}

const AddConnectionForm = () => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ConnectionFormInput>({
    resolver: zodResolver(ConnectionFormSchema),
    defaultValues: {
      connection_name: '',
      scheme: Scheme.MySQL,
      port: 3306,
      color: 'orange',
      host: '',
      username: '',
      password: '',
      save_password: false,
      dbname: '',
      params: '',
    },
  });
  return (
    <div className="flex-2 p-3 max-w-lg">
      <form className="flex w-full flex-col gap-1"
        onSubmit={handleSubmit((d: any) => console.log(d))}>
        <div>
          <h2 className="text-2xl font-bold text">{t('components.add_connection_form.title')}</h2>
        </div>
        <div className='flex gap-3'>
          <div className='w-full'>
            <div className="mb-2 block">
              <Label htmlFor="connection_name" value={t('components.add_connection_form.labels.connection_name')}
              />
            </div>
            <TextInput {...register('connection_name')} sizing="sm" id="connection_name" minLength={2} maxLength={255} />
            {errors?.connection_name?.message && <p className="text py-2">{errors.connection_name.message}</p>}
          </div>
          <div>
            <div className='w-full flex flex-col justify-stretch items-stretch'>
              <div className="my-1 block">
                <Label htmlFor="rolor" value={t('components.add_connection_form.labels.color')} />
              </div>
              <div className="flex items-center gap-3">
                <ColorCircle {...{ color: watch('color') }} />
                <Dropdown theme={{ "arrowIcon": "ml-2 h-4 w-4 text" }} placement="bottom" id="color" inline size="sm" className="h-60 py-2 overflow-y-auto" label="">
                  {connectionColors.map((color) => (
                    <Dropdown.Item id={color} onClick={() => setValue('color', color)}>
                      <ColorCircle {...{ color }} />
                      {titleCase(color)}
                    </Dropdown.Item>
                  ))}
                </Dropdown>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className='w-3/4'>
            <div className="my-1 block">
              <Label htmlFor="scheme" value={t('components.add_connection_form.labels.scheme')} />
            </div>
            <Select id="scheme" required sizing="sm" >
              {schemes.map((scheme) => (<option id={scheme}>{scheme}</option>))}
            </Select>
          </div>
          <div className='w-1/4'>
            <div className="my-1 block">
              <Label htmlFor="port" value={t('components.add_connection_form.labels.port')} />
            </div>
            <TextInput {...register('port')} type="number" sizing="sm" id="port" />
            {errors?.port?.message && <p>{errors.port.message}</p>}
          </div>
        </div>
        <div className="flex gap-3">
          <div className='w-3/4'>
            <div className="my-1 block">
              <Label htmlFor="host" value={t('components.add_connection_form.labels.host')} />
            </div>
            <TextInput {...register('host')} sizing="sm" id="host" />
            {errors?.host?.message && <p>{errors.host.message}</p>}
          </div>
          <div className='w-1/4'>
            <div className="my-1 block">
              <Label htmlFor="dbname" value={t('components.add_connection_form.labels.dbname')} />
            </div>
            <TextInput {...register('dbname')} sizing="sm" id="dbname" />
            {errors?.dbname?.message && <p>{errors.dbname.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className='w-full'>
            <div className="my-1 block">
              <Label htmlFor="username" value={t('components.add_connection_form.labels.username')} />
            </div>
            <TextInput {...register('username')} sizing="sm" id="username" />
            {errors?.username?.message && <p>{errors.username.message}</p>}
          </div>
          <div className='w-full'>
            <div className="my-1 block">
              <Label htmlFor="password" value={t('components.add_connection_form.labels.password')} />
            </div>
            <TextInput {...register('password')} type="password" sizing="sm" id="password" />
            {errors?.password?.message && <p>{errors.password.message}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 my-2">
          <Checkbox id="save_password" {...register('save_password')} />
          <Label htmlFor="save_password">
            {t('components.add_connection_form.labels.save_password')}
          </Label>
        </div>
        <Button type="submit" size="sm">{t('components.add_connection_form.title')}</Button>
      </form>
    </div>
  )
}

export default AddConnectionForm
