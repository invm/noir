import { Button, Checkbox, Label, TextInput } from 'flowbite-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { i18n } from '../utils/i18n';

const MIN_LENGTH_STR = 2;
const MAX_LENGTH_STR = 255;
const MAX_PORT = 65535;
const MIN_PORT = 1;

const FormSchema = z.object({
  name: z.string().min(MIN_LENGTH_STR, i18n.t('components.add_connection_form.validations.name_length')).max(MAX_LENGTH_STR),
  color: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  default_db: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  save_password: z.boolean().default(false),
  scheme: z.enum(['http', 'https']),
  username: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  password: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  host: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR).url(),
  port: z.number().min(MIN_PORT).max(MAX_PORT),
  dbname: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  params: z.string().min(MIN_LENGTH_STR).max(MAX_LENGTH_STR),
  email: z.string(),
  isAdmin: z.boolean(),
  createdAt: z.coerce.date(),
});

type FormInput = z.infer<typeof FormSchema>;

const AddConnectionForm = () => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      email: '',
      isAdmin: true,
      createdAt: new Date(),
    },
  });
  return (
    <form className="flex w-full flex-col gap-4"
      onSubmit={handleSubmit((d: any) => console.log(d))}>
      <div>
        <div className="mb-2 block">
          <Label
            htmlFor="name"
            value="Connection name"
          />
        </div>
        <TextInput {...register('name')} id="name" maxLength={255} />
        {errors?.name?.message && <p>{errors.name.message}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="save_password"
          {...register('save_password')}
        />
        <Label htmlFor="save_password">
          {t('components.add_connection_form.save_password')}
        </Label>
      </div>
      <Button type="submit">
        Submit
      </Button>
    </form >
  )
}

export default AddConnectionForm
