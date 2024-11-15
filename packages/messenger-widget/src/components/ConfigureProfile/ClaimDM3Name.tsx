import { useContext } from 'react';
import { fetchDM3NameComponent } from './bl';
import { ConfigureProfileContext } from './context/ConfigureProfileContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';

export function ClaimDM3Name() {
    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    const { dm3NameServiceSelected } = useContext(ConfigureProfileContext);

    return (
        <div className="mt-4 ms-4 me-4 dm3-prof-select-container">
            <div className="dm3-prof-select-type">
                Add new dm3 profile - claim dm3 profile - claim name
            </div>

            <div className="p-4">
                {fetchDM3NameComponent(
                    dm3NameServiceSelected,
                    dm3Configuration.chainId,
                )}
            </div>
        </div>
    );
}
