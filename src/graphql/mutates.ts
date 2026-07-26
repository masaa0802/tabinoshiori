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

export const INSERT_DOCUMENT = gql`
  mutation InsertDocument(
    $itinerary_id: Int!
    $category: String!
    $title: String!
    $date: date
    $notes: String
    $file_url: String
    $file_name: String
  ) {
    insert_documents(
      objects: {
        itinerary_id: $itinerary_id
        category: $category
        title: $title
        date: $date
        notes: $notes
        file_url: $file_url
        file_name: $file_name
      }
    ) {
      affected_rows
      returning {
        id
        itinerary_id
        category
        title
        date
        notes
        file_url
        file_name
        created_at
      }
    }
  }
`;

export const UPDATE_DOCUMENT = gql`
  mutation UpdateDocument(
    $id: Int!
    $category: String!
    $title: String!
    $date: date
    $notes: String
    $file_url: String
    $file_name: String
  ) {
    update_documents_by_pk(
      pk_columns: { id: $id }
      _set: {
        category: $category
        title: $title
        date: $date
        notes: $notes
        file_url: $file_url
        file_name: $file_name
      }
    ) {
      id
      itinerary_id
      category
      title
      date
      notes
      file_url
      file_name
      created_at
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: Int!) {
    delete_documents_by_pk(id: $id) {
      id
    }
  }
`;

// 日程変更・期間外データ削除を1トランザクションで実行
export const UPDATE_ITINERARY_DATES_WITH_CLEANUP = gql`
  mutation UpdateItineraryDatesWithCleanup(
    $id: Int!
    $start_date: date!
    $end_date: date!
  ) {
    update_itineraries_by_pk(
      pk_columns: { id: $id }
      _set: { start_date: $start_date, end_date: $end_date }
    ) {
      id
      start_date
      end_date
    }
    delete_activities(
      where: {
        itinerary_id: { _eq: $id }
        _or: [
          { date: { _lt: $start_date } }
          { date: { _gt: $end_date } }
        ]
      }
    ) {
      affected_rows
    }
    delete_budgets(
      where: {
        itinerary_id: { _eq: $id }
        _or: [
          { date: { _lt: $start_date } }
          { date: { _gt: $end_date } }
        ]
      }
    ) {
      affected_rows
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

export const INSERT_TRAVEL_DOCUMENT = gql`
  mutation InsertTravelDocument(
    $itinerary_id: Int!
    $title: String!
    $category: String!
    $date: date
    $reservation_number: String
    $notes: String
    $files: [document_files_insert_input!]!
  ) {
    insert_travel_documents_one(
      object: {
        itinerary_id: $itinerary_id
        title: $title
        category: $category
        date: $date
        reservation_number: $reservation_number
        notes: $notes
        document_files: { data: $files }
      }
    ) {
      id
      title
      category
      date
      reservation_number
      notes
      created_at
      document_files {
        id
        file_url
        file_type
        file_name
        file_size
        mime_type
        cloudinary_public_id
      }
    }
  }
`;

export const UPDATE_TRAVEL_DOCUMENT = gql`
  mutation UpdateTravelDocument(
    $id: Int!
    $title: String
    $category: String
    $date: date
    $reservation_number: String
    $notes: String
  ) {
    update_travel_documents_by_pk(
      pk_columns: { id: $id }
      _set: {
        title: $title
        category: $category
        date: $date
        reservation_number: $reservation_number
        notes: $notes
        updated_at: "now()"
      }
    ) {
      id
      title
      category
      date
      reservation_number
      notes
      updated_at
    }
  }
`;

export const DELETE_TRAVEL_DOCUMENT = gql`
  mutation DeleteTravelDocument($id: Int!) {
    delete_travel_documents_by_pk(id: $id) {
      id
      document_files {
        cloudinary_public_id
      }
    }
  }
`;

export const INSERT_DOCUMENT_FILE = gql`
  mutation InsertDocumentFile(
    $document_id: Int!
    $file_url: String!
    $file_type: String!
    $file_name: String!
    $file_size: Int
    $mime_type: String
    $cloudinary_public_id: String
    $display_order: Int
  ) {
    insert_document_files_one(
      object: {
        document_id: $document_id
        file_url: $file_url
        file_type: $file_type
        file_name: $file_name
        file_size: $file_size
        mime_type: $mime_type
        cloudinary_public_id: $cloudinary_public_id
        display_order: $display_order
      }
    ) {
      id
      file_url
      file_name
      file_type
      file_size
      mime_type
      cloudinary_public_id
    }
  }
`;

export const DELETE_DOCUMENT_FILE = gql`
  mutation DeleteDocumentFile($id: Int!) {
    delete_document_files_by_pk(id: $id) {
      id
      cloudinary_public_id
    }
  }
`;
