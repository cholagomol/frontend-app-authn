import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';
import PropTypes from 'prop-types';

import messages from './messages';
import { LOGIN_PAGE } from '../data/constants';

const SocialAuthProviders = (props) => {
  const { formatMessage } = useIntl();
  const { referrer, socialAuthProviders } = props;

  function handleSubmit(e) {
    e.preventDefault();
    const url = e.currentTarget.dataset.providerUrl;
    window.location.href = getConfig().LMS_BASE_URL + url;
  }

  const socialAuth = socialAuthProviders.map((provider) => {
    let displayName = provider.name;
    let iconSrc = provider.iconImage;

    // Custom labels for KKU Academy
    if (provider.id.includes('google')) {
      displayName = 'Google';
      iconSrc = iconSrc || 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg';
    } else if (provider.id.includes('saml') || provider.id.includes('kku')) {
      displayName = 'SSO-KKU';
      iconSrc = iconSrc || 'https://kku.ac.th/wp-content/uploads/2021/01/logo-kku.png';
    }

    return (
      <button
        id={provider.id}
        key={provider.id}
        type="button"
        className="kku-social-btn"
        data-provider-url={referrer === LOGIN_PAGE ? provider.loginUrl : provider.registerUrl}
        onClick={handleSubmit}
      >
        {iconSrc && <img src={iconSrc} alt={displayName} />}
        <span>{displayName}</span>
        <span className="sr-only">
          {referrer === LOGIN_PAGE
            ? formatMessage(messages['sso.sign.in.with'], { providerName: displayName })
            : formatMessage(messages['sso.create.account.using'], { providerName: displayName })}
        </span>
      </button>
    );
  });

  return <>{socialAuth}</>;
};

SocialAuthProviders.defaultProps = {
  referrer: LOGIN_PAGE,
  socialAuthProviders: [],
};

SocialAuthProviders.propTypes = {
  referrer: PropTypes.string,
  socialAuthProviders: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    iconClass: PropTypes.string,
    iconImage: PropTypes.string,
    loginUrl: PropTypes.string,
    registerUrl: PropTypes.string,
    skipRegistrationForm: PropTypes.bool,
  })),
};

export default SocialAuthProviders;
