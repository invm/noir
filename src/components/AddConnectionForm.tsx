import { Button, Checkbox, Label, TextInput } from 'flowbite-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const FormSchema = z.object({
  username: z
    .string()
    .min(4, { message: "The username must be 4 characters or more" })
    .max(10, { message: "The username must be 10 characters or less" })
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "The username must contain only letters, numbers and underscore (_)"
    ),
  email: z.string(),
  isAdmin: z.boolean(),
  createdAt: z.coerce.date(),
});

type FormInput = z.infer<typeof FormSchema>;

const AddConnectionForm = () => {
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
            htmlFor="connection_name"
            value="Your email"
          />
        </div>

        <div>
          <label htmlFor="username">Username</label>
          <input id="username" {...register('username')} />
          {errors?.username?.message && <p>{errors.username.message}</p>}
        </div>
        <TextInput
          id="connection_name"
          placeholder="name@flowbite.com"
          required
          type="email"
        />
      </div>
      <div>
        <div className="mb-2 block">
          <Label
            htmlFor="password1"
            value="Your password"
          />
        </div>
        <TextInput
          id="password1"
          required
          type="password"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="remember" />
        <Label htmlFor="remember">
          Remember me
        </Label>
      </div>
      <Button type="submit">
        Submit
      </Button>
    </form >
  )
}

export default AddConnectionForm
