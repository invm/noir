import { Kbd } from 'components/ui/kbd';

const TriggerCommandPalette = () => {
  return (
    <div>
      <div class="flex gap-2">
        <span>Command Palette </span>
        <div>
          <Kbd key="K" />
        </div>
      </div>
    </div>
  );
};

export default TriggerCommandPalette;
