import { gql } from "@apollo/client";

export const INSERT_ACTIVITIES = gql`
  mutation InsertActivities(
    $itinerary_id: Int!
    $name: String!
    $location: String
    $notes: String
    $type: String
    $date: date!
    $time: time
    $photo_url: String
    $lat: numeric
    $lng: numeric
    $place_id: String
  ) {
    insert_activities(
      objects: {
        itinerary_id: $itinerary_id
        name: $name
        location: $location
        notes: $notes
        type: $type
        date: $date
        time: $time
        photo_url: $photo_url
        lat: $lat
        lng: $lng
        place_id: $place_id
      }
    ) {
      affected_rows
      returning {
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
  }
`;

export const INSERT_BUDGET = gql`
  mutation InsertBudget(
    $itinerary_id: Int!
    $date: date!
    $activity_id: Int
    $category: String!
    $amount: numeric!
    $description: String
    $currency: String
    $paid_by: String
  ) {
    insert_budgets(
      objects: {
        itinerary_id: $itinerary_id
        date: $date
        activity_id: $activity_id
        category: $category
        amount: $amount
        description: $description
        currency: $currency
        paid_by: $paid_by
      }
    ) {
      affected_rows
      returning {
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
      }
    }
  }
`;

export const UPDATE_BUDGET = gql`
  mutation UpdateBudget(
    $id: Int!
    $activity_id: Int
    $category: String!
    $amount: numeric!
    $description: String
  ) {
    update_budgets_by_pk(
      pk_columns: { id: $id }
      _set: {
        activity_id: $activity_id
        category: $category
        amount: $amount
        description: $description
      }
    ) {
      id
      itinerary_id
      date
      activity_id
      category
      amount
      description
      currency
      created_at
    }
  }
`;

export const DELETE_BUDGET = gql`
  mutation DeleteBudget($id: Int!) {
    delete_budgets_by_pk(id: $id) {
      id
    }
  }
`;

export const UPDATE_ACTIVITY = gql`
  mutation UpdateActivity(
    $id: Int!
    $name: String!
    $location: String!
    $notes: String
    $type: String!
    $date: date!
    $time: time!
    $photo_url: String
    $lat: numeric
    $lng: numeric
    $place_id: String
  ) {
    update_activities_by_pk(
      pk_columns: { id: $id }
      _set: {
        name: $name
        location: $location
        notes: $notes
        type: $type
        date: $date
        time: $time
        photo_url: $photo_url
        lat: $lat
        lng: $lng
        place_id: $place_id
      }
    ) {
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

export const DELETE_ACTIVITY = gql`
  mutation DeleteActivity($id: Int!) {
    delete_activities_by_pk(id: $id) {
      id
    }
  }
`;
export const INSERT_GROUP = gql`
  mutation InsertGroup(
    $name: String!
    $token: String!
  ) {
    insert_groups(
      objects: {
        name: $name
        token: $token
      }
    ) {
      affected_rows
      returning {
        id
        name
        token
        created_at
        updated_at
      }
    }
  }
`;

export const INSERT_ITINERARY = gql`
  mutation InsertItinerary(
    $group_id: uuid!
    $title: String!
    $destination: String
    $start_date: date!
    $end_date: date!
    $travel_purpose: String
    $location_type: String!
    $created_by: Int
  ) {
    insert_itineraries(
      objects: {
        group_id: $group_id
        title: $title
        destination: $destination
        start_date: $start_date
        end_date: $end_date
        travel_purpose: $travel_purpose
        location_type: $location_type
        created_by: $created_by
      }
    ) {
      affected_rows
      returning {
        id
        group_id
        title
        destination
        start_date
        end_date
        travel_purpose
        location_type
        created_by
        updated_at
        total_budget
      }
    }
  }
`;

export const UPDATE_ITINERARY_TOTAL_BUDGET = gql`
  mutation UpdateItineraryTotalBudget(
    $id: Int!
    $total_budget: numeric!
  ) {
    update_itineraries_by_pk(
      pk_columns: { id: $id }
      _set: { total_budget: $total_budget }
    ) {
      id
      total_budget
      updated_at
    }
  }
`;
