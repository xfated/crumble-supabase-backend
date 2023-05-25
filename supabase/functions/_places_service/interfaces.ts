export const extractObj = <ObjectType>(keys: readonly `${string & keyof ObjectType}`[]) => {
    return (object: any) => {
      const resultObject: ObjectType = {} as unknown as ObjectType;
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index] as unknown as keyof ObjectType;
        resultObject[key] = object[key];
      }

      return resultObject as ObjectType;
    }
  }

export interface Photo {
	height: number;
	width: number;
	photo_reference: string;
}

interface OpeningHours {
	open_now: boolean;
}

export interface Place {
	name: string;
	place_id: string;
	vicinity: string;
	types: string[];
	price_level: number;
	rating: number;
	photos: Photo[];
	user_ratings_total: number;
	business_status: string;
	// opening_hours: OpeningHours;
}

export interface PlacesRes {
	next_page_token: string;
	results: Place[];
}

export interface Review {
	author_name: string;
	time: number;
	rating: number;
	relative_time_description: string;
	profile_photo_url: string;
	language: string;
	original_language: string;
	text: string;
}

interface Location {
	lat: number;
	lng: number;
}

interface Geometry {
	location: Lo
	cation;
}

export interface AddressComponent {
	long_name: string;
	short_name: string;
	types: string[];
}

export interface PlaceDetail {
	place_id: string;
	name: string;
	url: string;
	geometry: Geometry;
	formatted_address: string;
	address_components: AddressComponent[];
	photos: Photo[];
	reviews: Review[];
	dine_in: boolean;
	takeout: boolean;
	serves_breakfast: boolean;
	serves_lunch: boolean;
	serves_dinner: boolean;	
}

export interface DetailRes {
	result: PlaceDetail;
}