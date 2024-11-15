import { useContext } from 'react';
import { fetchComponent } from './bl';
import { ConfigureProfileContext } from './context/ConfigureProfileContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';

export function ClaimOwnName() {
    const { dm3Configuration } = useContext(DM3ConfigurationContext);

    const { namingServiceSelected } = useContext(ConfigureProfileContext);

    return (
        <div className="mt-4 ms-4 me-4 dm3-prof-select-container">
            <div className="dm3-prof-select-type">
                Add new dm3 profile - claim dm3 profile - claim name
            </div>

            <div className="ens-components-container">
                {fetchComponent(
                    namingServiceSelected,
                    dm3Configuration.chainId,
                )}
            </div>
        </div>
    );
}
