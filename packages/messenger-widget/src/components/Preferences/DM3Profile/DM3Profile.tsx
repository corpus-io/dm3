import { useContext } from 'react';
import { Heading } from '../Heading/Heading';
import { MOBILE_SCREEN_WIDTH } from '../../../utils/common-utils';
import { ConfigureDM3Profile } from '../../ConfigureProfile/ConfigureProfile';
import { DM3ConfigurationContext } from '../../../context/DM3ConfigurationContext';
import { ConfigureProfileContextProvider } from '../../ConfigureProfile/context/ConfigureProfileContext';

export function DM3Profile() {
    const { screenWidth } = useContext(DM3ConfigurationContext);

    const heading = 'DM3 Profile Configuration';

    const description =
        screenWidth <= MOBILE_SCREEN_WIDTH
            ? ''
            : 'Your dm3 profile needs to be published. You can use your own web3 name (ENS, ...),' +
              'get a dm3 name, or keep your wallet address.';

    return (
        <div>
            <Heading heading={heading} description={description} />
            <ConfigureProfileContextProvider>
                <ConfigureDM3Profile />
            </ConfigureProfileContextProvider>
        </div>
    );
}
