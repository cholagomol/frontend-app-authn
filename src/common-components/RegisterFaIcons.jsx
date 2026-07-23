import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faApple, faFacebook, faGoogle, faLinkedin, faLinkedinIn, faMicrosoft,
} from '@fortawesome/free-brands-svg-icons';

export default function registerIcons() {
  library.add(faApple, faFacebook, faGoogle, faLinkedin, faLinkedinIn, faMicrosoft);
}
