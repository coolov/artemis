import { createHttpLink } from "apollo-link-http";
import apolloLink from "artemis";

export default opts => apolloLink(createHttpLink(opts));
