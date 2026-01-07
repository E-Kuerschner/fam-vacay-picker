import { Link as RouterLink } from "react-router";
import { Link as CDSLink, type LinkProps } from "@coinbase/cds-web/typography/Link";

/**
 * This Link component composes React-Router's Link with the CDS Link.
 * This component gets the both of both worlds.
 * Styling/Theming from CDS & router integration from React Rotuer.
 * @param props
 * @constructor
 */
export function Link(props: LinkProps<typeof RouterLink>) {
	return <CDSLink as={RouterLink} {...props} />;
}
