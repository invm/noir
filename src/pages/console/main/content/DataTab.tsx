import { useAppSelector } from 'services/Context';
import { Results } from './QueryTab/Results';

const DataTab = () => {
  const {
    connections: { getContentData },
    app: { gridTheme },
  } = useAppSelector();
  return (
    <Results
      editable={true}
      gridTheme={gridTheme()}
      table={getContentData('Data').table}
    />
  );
};

export { DataTab };
