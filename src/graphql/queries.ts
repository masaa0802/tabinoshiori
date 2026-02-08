import { gql } from "@apollo/client";

export const GET_GROUP = gql`
  query group_by_pk($id: uuid!) {
    group_by_pk(id: $id) {
      created_at
      id
      name
      updated_at
    }
  }
`;

export const GET_ITINERARIES = gql`
  query itineraries {
    itineraries {
      created_by
      destination
      end_date
      group_id
      id
      location_type
      start_date
      title
      travel_purpose
      updated_at
      total_budget
    }
  }
`;

export const GET_ITINERARY_BY_ID = gql`
  query itinerary_by_pk($id: Int!) {
    itineraries_by_pk(id: $id) {
      created_by
      destination
      end_date
      group_id
      id
      location_type
      start_date
      title
      travel_purpose
      updated_at
      total_budget
    }
  }
`;

export const GET_ITINERARY_BY_GROUP = gql`
  query itineraries_by_group($group_id: uuid!, $id: Int!) {
    itineraries(where: { group_id: { _eq: $group_id }, id: { _eq: $id } }) {
      created_by
      destination
      end_date
      group_id
      id
      location_type
      start_date
      title
      travel_purpose
      updated_at
      total_budget
    }
  }
`;

export const GET_ACTIVITIES = gql`
query activities($itinerary_id: Int!) {
  activities(where: { itinerary_id: { _eq: $itinerary_id } }, order_by: { date: asc, time: asc }) {
    id
		itinerary_id
		name
		location
		notes
		type
		date
		time
		photo_url
		lat
		lng
		place_id
  }
}
`;

export const GET_BUDGETS = gql`
  query GetBudgets($itinerary_id: Int!) {
    budgets(where: { itinerary_id: { _eq: $itinerary_id } }, order_by: { date: asc, created_at: desc }) {
      id
      itinerary_id
      date
      activity_id
      category
      amount
      description
      currency
      paid_by
      created_at
      activity {
        id
        name
        type
      }
    }
  }
`;

export const GET_BUDGETS_BY_DATE = gql`
  query GetBudgetsByDate($itinerary_id: Int!, $date: date!) {
    budgets(where: { itinerary_id: { _eq: $itinerary_id }, date: { _eq: $date } }) {
      id
      itinerary_id
      date
      activity_id
      category
      amount
      description
      currency
      paid_by
      created_at
      activity {
        id
        name
        type
      }
    }
  }
`;

export const GET_ACTIVITIES_BY_DATE = gql`
  query GetActivitiesByDate($itinerary_id: Int!, $date: date!) {
    activities(where: { itinerary_id: { _eq: $itinerary_id }, date: { _eq: $date } }) {
      id
      name
      type
      location
    }
  }
`;

export const GET_TRAVEL_DOCUMENTS = gql`
  query GetTravelDocuments($itinerary_id: Int!) {
    travel_documents(
      where: { itinerary_id: { _eq: $itinerary_id } }
      order_by: { created_at: desc }
    ) {
      id
      title
      category
      date
      reservation_number
      notes
      created_at
      updated_at
      files: document_files(order_by: { display_order: asc }) {
        id
        file_url
        file_type
        file_name
        file_size
        mime_type
        display_order
      }
    }
  }
`;

export const GET_TRAVEL_DOCUMENT = gql`
  query GetTravelDocument($id: Int!) {
    travel_documents_by_pk(id: $id) {
      id
      title
      category
      date
      reservation_number
      notes
      created_at
      updated_at
      files: document_files(order_by: { display_order: asc }) {
        id
        file_url
        file_type
        file_name
        file_size
        mime_type
        cloudinary_public_id
        display_order
      }
    }
  }
`;

export const GET_DOCUMENTS_BY_CATEGORY = gql`
  query GetDocumentsByCategory($itinerary_id: Int!, $category: String!) {
    travel_documents(
      where: {
        itinerary_id: { _eq: $itinerary_id }
        category: { _eq: $category }
      }
      order_by: { date: asc }
    ) {
      id
      title
      category
      date
      reservation_number
      notes
      files: document_files(order_by: { display_order: asc }) {
        id
        file_url
        file_type
        file_name
        file_size
      }
    }
  }
`;
