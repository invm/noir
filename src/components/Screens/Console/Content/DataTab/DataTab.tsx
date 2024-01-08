import { useAppSelector } from 'services/Context';
import { Results } from '../QueryTab/Results';

const DataTab = () => {
  const {
    connections: { getContentData },
  } = useAppSelector();
  return <Results editable={true} table={getContentData('Data').table} />;
};

export { DataTab };
