import { ApiResponse, httpUtils } from "./http_utils.ts"
import { createUrlWithKey } from "./google_api_utils.ts"

const AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json?"

interface AutocompletePred {
    description: string;
    place_id: string;
    reference: string;
}

interface AutocompleteRes {
    predictions: AutocompletePred[];
}

interface QueryAutocompleteRes {
    predictions: string[]
}

export const queryAutocomplete = async (input: string, country: string): QueryAutocompleteRes => {
    const params = new Map();
    params.set("input", input)
    if (country.length > 0) {
        params.set("components", `country:${country}`)
    }
    const url = createUrlWithKey(AUTOCOMPLETE_URL, params);
    console.log(url)
    // Make request
    const res: ApiResponse<any> = await httpUtils.get(url)
    if (!res.success || res.data === null) {
        throw new Error(res.message ?? "Unable to getNearbyPlaces")
    }   

    const predictions = (res.data as AutocompleteRes)
        .predictions
        .map(pred => pred.description)
    
    return {
        predictions
    }
}