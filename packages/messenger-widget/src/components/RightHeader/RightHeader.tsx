import { useContext, useEffect } from 'react';
import { MobileView } from './MobileView';
import { NormalView } from './NormalView';
import { MOBILE_SCREEN_WIDTH } from '../../utils/common-utils';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { DM3UserProfileContext } from '../../context/DM3UserProfileContext';
import { useMainnetProvider } from '../../hooks/mainnetprovider/useMainnetProvider';
import { AuthContext } from '../../context/AuthContext';
import { getAvatarProfilePic } from '../../utils/ens-utils';

export function RightHeader() {
    const { account } = useContext(AuthContext);

    const { screenWidth, dm3Configuration } = useContext(
        DM3ConfigurationContext,
    );

    const { setAccountProfilePicture } = useContext(DM3UserProfileContext);

    const mainnetProvider = useMainnetProvider();

    // fetched profile pic of signed in user
    const fetchAndSetProfilePic = async () => {
        setAccountProfilePicture(
            await getAvatarProfilePic(
                mainnetProvider,
                account?.ensName as string,
                dm3Configuration.addressEnsSubdomain,
            ),
        );
    };

    // loads the profile pic on page render
    useEffect(() => {
        fetchAndSetProfilePic();
    }, []);

    return (
        <>
            {screenWidth <= MOBILE_SCREEN_WIDTH ? (
                <MobileView />
            ) : (
                <NormalView />
            )}
        </>
    );
}
