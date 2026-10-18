// Shopify Admin GraphQL Query to fetch EU orders for PackEPR calculation
export const EU_ORDERS_GRAPHQL_QUERY = `#graphql
  query GetEuOrdersForEpr($cursor: String, $queryFilter: String!) {
    orders(first: 100, after: $cursor, query: $queryFilter) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        createdAt
        shippingAddress {
          countryCodeV2
        }
      }
    }
  }
`;

export const SUPPORTED_EU_COUNTRIES = new Set(['DE', 'FR', 'AT', 'IT', 'ES', 'NL', 'BE', 'PL', 'SE']);
