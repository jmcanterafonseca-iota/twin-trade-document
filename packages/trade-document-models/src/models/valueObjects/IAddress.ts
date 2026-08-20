// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { SchemaOrgContexts } from "@twin.org/standards-schema-org";

/**
 * A postal address, expressed with the schema.org vocabulary.
 * x-json-ld-type: https://schema.org/PostalAddress
 */
export interface IAddress {
	/**
	 * LD Context
	 */
	"@context": typeof SchemaOrgContexts.Context;

	/**
	 * LD Type
	 */
	type: "Address";

	/**
	 * The country. Recommended to be in 2-letter ISO 3166-1 alpha-2 format,
	 * for example "US".
	 * x-json-ld-property: https://schema.org/addressCountry
	 */
	addressCountry: string;

	/**
	 * The locality in which the street address is, and which is in the
	 * region. For example, Mountain View.
	 * x-json-ld-property: https://schema.org/addressLocality
	 */
	addressLocality: string;

	/**
	 * The region in which the locality is, and which is in the country. For
	 * example, California.
	 * x-json-ld-property: https://schema.org/addressRegion
	 */
	addressRegion: string;

	/**
	 * The post office box number for PO box addresses.
	 * x-json-ld-property: https://schema.org/postOfficeBoxNumber
	 */
	postOfficeBoxNumber: string;

	/**
	 * The postal code. For example, 94043.
	 * x-json-ld-property: https://schema.org/postalCode
	 */
	postalCode: string;

	/**
	 * The street address. For example, 1600 Amphitheatre Pkwy.
	 * x-json-ld-property: https://schema.org/streetAddress
	 */
	streetAddress: string;
}
