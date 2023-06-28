import * as z from 'zod';
import Button from './UI/Button';
import Checkbox from './UI/Checkbox';
import Label from './UI/Label';
import TextInput from './UI/TextInput';

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
  const onSubmit = (data: any) => console.log(data);
  return (
    <form class="flex w-full flex-col gap-4"
      onSubmit={d => onSubmit(d)}>
      <div>
        <div class="mb-2 block">
          <Label for="connection_name" value="Your email" />
        </div>

        <div>
          <label for="username">Username</label>
          <input id="username" />
          {/*
          {errors?.username?.message && <p>{errors.username.message}</p>}
          */}
        </div>
        <TextInput id="connection_name" placeholder="name@flowbite.com" required type="email" />
      </div>
      <div>
        <div class="mb-2 block">
          <Label for="password1" value="Your password" />
        </div>
        <TextInput id="password1" required type="password" />
      </div>
      <div class="flex items-center gap-2">
        <Checkbox id="remember" checked />
        <Label for="remember"> Remember me </Label>
      </div>
      <Button type="submit">
        Submit
      </Button>
    </form >
  )
}

export default AddConnectionForm
