window.CONTINUUM_ATLAS = {
  "record": {
    "schema_version": "0.1.0",
    "inquiry": {
      "id": "CMA-DEMO-001",
      "title": "The maintained candle flame",
      "question": "What stabilizes the visible flame while its material inventory is continuously replaced?",
      "investigator": "Nested Causality Atlas working example",
      "created": "2026-08-14T11:30:00-07:00",
      "status": "mapped"
    },
    "observation": {
      "statement": "A candle flame retains a recognizable position and form while wax vapor, oxygen, products, and heat continuously cross its boundary.",
      "kind": "observation",
      "observer": "human observer",
      "instrument": "vision; optional thermocouple, balance, and gas analyzer",
      "location": "still indoor air at standard room conditions",
      "time": "during a stable burn interval",
      "resolution": "macroscopic flame envelope",
      "uncertainty": "air motion, wick geometry, wax composition, and measurement disturbance alter the envelope",
      "reproduction": "repeat with the same candle and controlled airflow"
    },
    "reference": {
      "local_zero": "the same candle and room conditions before ignition, with no sustained flame envelope",
      "scale_address": "human-visible combustion enclosure",
      "duration": "one stable burn interval",
      "resolution": "millimetres and seconds",
      "justification": "the comparison isolates the maintained combustion departure without treating the local unlit state as the origin of all scale",
      "zero_infinity_role": "recursively_available_departure_reference"
    },
    "time_address": {
      "beginning_boundary": "the declared onset of a stable visible flame after ignition",
      "ending_boundary": "extinction or the declared end of the instrumented burn interval",
      "enclosing_clock": "the bounded stable-burn interval maintained by the candle and room atmosphere",
      "counted_transition": "one completed synchronized observation sample of flame geometry and boundary exchange",
      "completed_passages": "not counted in this worked map",
      "phase": 1,
      "passage_direction": "maintained",
      "measured_rate": "fuel mass loss, heat release, and image samples per conventional second",
      "scale_address": "macroscopic combustion time within the room-atmosphere enclosure",
      "conventional_translation": "instrument timestamps retained in UTC-compatible seconds",
      "rate_variation": "flicker, fuel flow, and heat-release variation remain observable rather than being replaced by the sampling clock",
      "final_frontier": "the ending boundary of the instrumented burn interval",
      "evidence_status": "illustrative"
    },
    "departure": {
      "description": "a luminous, heat-releasing, non-equilibrium steady-state reaction envelope",
      "sign": 1,
      "magnitude": "measured by luminosity, temperature field, and reaction rate",
      "unit": "instrument-dependent",
      "duration": "while fuel, oxidizer, ignition temperature, and pressure remain admissible",
      "state": "maintained"
    },
    "active_enclosure": {
      "id": "flame-envelope",
      "name": "visible combustion envelope",
      "kind": "non_equilibrium_steady_state",
      "boundary": "the spatial region in which reaction, luminosity, and temperature remain above the declared detection thresholds",
      "maintained_identity": "a flame of stable mean location and recognizable geometry",
      "required_conditions": [
        "wax vapor supply",
        "oxygen supply",
        "temperature above the sustaining threshold",
        "pressure and flow within a stable regime"
      ]
    },
    "enclosing_enclosures": [
      {
        "id": "room-atmosphere",
        "name": "room atmosphere",
        "kind": "steady_state_equilibrium",
        "boundary": "the pressure and composition field surrounding the flame",
        "maintained_identity": "an oxygen-bearing atmosphere near room pressure",
        "required_conditions": [
          "available oxidizer",
          "pressure",
          "buoyant exhaust path"
        ],
        "projected_conditions": [
          "oxygen partial pressure",
          "ambient pressure",
          "flow constraints",
          "heat-removal conditions"
        ],
        "projection_carrier": "molecular collision, diffusion, convection, and pressure",
        "variation_test": "reduce oxygen concentration or impose airflow while holding candle geometry approximately fixed and measure the change in flame persistence"
      }
    ],
    "enclosed_enclosures": [
      {
        "id": "wick-fuel-interface",
        "name": "wick and vaporization interface",
        "kind": "non_equilibrium_steady_state",
        "boundary": "wick surface and adjacent wax-vapor region",
        "maintained_identity": "capillary fuel delivery and vapor formation",
        "required_conditions": [
          "liquid wax",
          "wick continuity",
          "sufficient heat feedback"
        ],
        "contribution": "delivers wax vapor and heat-coupled fuel flow into the reaction envelope",
        "outward_direction_name": "contribution"
      }
    ],
    "parallel_enclosures": [
      {
        "id": "exhaust-plume",
        "name": "buoyant exhaust plume",
        "kind": "non_equilibrium_steady_state",
        "boundary": "rising region of heated products above the flame",
        "maintained_identity": "a convective plume carrying products and heat away",
        "required_conditions": [
          "gravity",
          "density contrast",
          "available surrounding air"
        ],
        "shared_boundary": "upper reaction envelope",
        "relationship": "cooperative"
      },
      {
        "id": "wax-pool",
        "name": "liquid wax pool",
        "kind": "non_equilibrium_steady_state",
        "boundary": "melted wax surrounding the wick",
        "maintained_identity": "a replenished liquid fuel reservoir",
        "required_conditions": [
          "solid wax supply",
          "heat flux",
          "container geometry"
        ],
        "shared_boundary": "wick base and thermal field",
        "relationship": "cooperative"
      }
    ],
    "exchanges": [
      {
        "boundary": "wick interface to flame envelope",
        "quantity": "wax-derived matter",
        "unit": "mass per time",
        "departing": "mass loss measured at candle",
        "arriving": "vapor entering reaction zone",
        "stored": "transient vapor and intermediates",
        "transformed": "combustion products and soot fraction",
        "residual": "measurement closure error",
        "uncertainty": "requires synchronized mass and exhaust measurements",
        "status": "bounded"
      },
      {
        "boundary": "atmosphere to flame and flame to room",
        "quantity": "energy",
        "unit": "joules per second",
        "departing": "chemical potential of reactants",
        "arriving": "reaction energy",
        "stored": "transient thermal energy in wax, wick, gases, and nearby surfaces",
        "transformed": "radiation, convection, conduction, and chemical products",
        "residual": "calorimetric closure error",
        "uncertainty": "open-room calorimetry does not capture every path",
        "status": "bounded"
      }
    ],
    "ivm_passage": {
      "current_ivm_address": "IVM:combustion:macroscopic:flame-envelope",
      "vector_equilibrium": "the stable mean flame geometry under the declared fuel, oxygen, pressure, and flow conditions",
      "departure_geometry": "expanded",
      "active_cell": {
        "geometry": "tetrahedral_octahedral_junction",
        "address": "worked-chart-cell:0"
      },
      "periphery_boundary": "the reaction envelope at which heat release and reactant supply no longer sustain the declared flame geometry",
      "saturation_quantity": "departure of oxygen supply, heat release, and flow from the stable mean flame condition",
      "capacity_condition": "the current macroscopic combustion enclosure ceases to maintain a stable visible flame when projected atmospheric conditions cross the sustaining range",
      "jitterbug_state": "not_observed",
      "adjacent_ivm_address": "IVM:combustion:extinguished-or-transformed-envelope",
      "passage_direction": "deescalation",
      "preserved_across_passage": [
        "wax-derived matter",
        "oxygen and combustion products",
        "energy transformed into heat, radiation, and stored thermal states"
      ],
      "post_passage_projection": "the room atmosphere continues to project pressure, composition, and heat-removal conditions into the transformed state",
      "evidence_status": "illustrative"
    },
    "scale_route": {
      "current_tier": "macroscopic combustion geometry",
      "local_authority": [
        "thermodynamics",
        "fluid mechanics",
        "reaction kinetics",
        "radiative transfer"
      ],
      "smooth_within_tier": true,
      "ivm_passage_id": "IVM:combustion:macroscopic:flame-envelope",
      "escalation": {
        "trigger": "room-scale ventilation or pressure dominates flame-local conditions",
        "destination": "room atmosphere and building airflow enclosure",
        "status": "available"
      },
      "deescalation": {
        "trigger": "macroscopic averages fail to account for reaction or transport",
        "destination": "molecular reaction and transport enclosure",
        "status": "available"
      }
    },
    "final_frontier": {
      "observed_end": "the instrumented room, candle, flame envelope, and measured exhaust during the burn interval",
      "derived_end": "mass and energy pathways supported by the selected thermodynamic, fluid, and reaction models",
      "unavailable": "unmeasured microscopic trajectories and influences beyond the instrumented room and time interval",
      "halt_reason": "the inquiry ends where available instruments and the declared model cannot distinguish further boundary contributions",
      "scale_extremes": {
        "inward": {
          "mapped_anchor": "the wick-fuel interface is the smallest displayed enclosure; the standard Planck-length reference remains farther inward",
          "frontier_beyond": "the inward Final Frontier is placed beyond the Planck-length anchor toward smaller presently unavailable enclosures",
          "reason": "no displayed or standard minimum scale is promoted into the end of possible depth"
        },
        "outward": {
          "mapped_anchor": "the room atmosphere is the largest displayed enclosing equilibrium",
          "frontier_beyond": "the outward Final Frontier is placed beyond the room and every larger enclosure currently displayed",
          "reason": "the largest mapped influence cannot be promoted into the end of the physical universe"
        }
      },
      "temporal_frontier": {
        "beginning_boundary": "stable flame onset after ignition",
        "ending_boundary": "extinction or declared observation halt",
        "beyond_current_count": "prior ignition history and later room evolution remain available to enclosing temporal maps",
        "halt_condition": "the present flame record ends when its declared burn interval ends"
      },
      "frontier_condition": "deterministic_infinity_at_present_end_of_knowledge_and_physical_availability",
      "prohibited_promotions": [
        "a bounded residual is not proof of destruction",
        "the room boundary is not the end of physical scale",
        "a stable flame shape is not a static material inventory"
      ]
    },
    "target": {
      "boundary_condition": "oxygen partial pressure projected by the enclosing atmosphere",
      "intervention": "vary oxygen concentration in a controlled chamber while holding wick, wax, pressure, and airflow within measured bounds",
      "prediction": "below a reproducible oxygen condition the enclosing atmosphere will no longer sustain the flame departure and the visible envelope will collapse",
      "alternative": "if flame persistence is unchanged across the admissible oxygen variation, the proposed active projection is incomplete or incorrectly targeted",
      "falsification": "the flame remains stable after the mapped projected condition is removed while all replacement conditions and exchanges are measured",
      "return_path": [
        "instrument chamber oxygen and pressure",
        "observe flame geometry and persistence",
        "balance fuel and energy exchanges",
        "compare with the declared local zero",
        "revise the active enclosure or reject the proposed projection"
      ]
    },
    "enclosure_function": {
      "enclosing": "room-atmosphere",
      "departure": "flame-envelope",
      "enclosed": "wick-fuel-interface",
      "parallel": [
        "exhaust-plume",
        "wax-pool"
      ]
    },
    "unresolved": [
      "complete calorimetric closure is not supplied by this example",
      "the scale-transition thresholds are operational choices, not universal constants"
    ]
  },
  "layout": {
    "nodes": [
      {
        "id": "zero-infinity",
        "label": "0∞",
        "kind": "reference",
        "x": 800,
        "y": 500,
        "size": 15
      },
      {
        "id": "flame-envelope",
        "label": "Visible flame",
        "kind": "active",
        "x": 800,
        "y": 380,
        "size": 20
      },
      {
        "id": "room-atmosphere",
        "label": "Room atmosphere",
        "kind": "enclosing",
        "x": 800,
        "y": 175,
        "size": 18
      },
      {
        "id": "wick-fuel-interface",
        "label": "Wick + vapor",
        "kind": "enclosed",
        "x": 800,
        "y": 735,
        "size": 16
      },
      {
        "id": "exhaust-plume",
        "label": "Exhaust plume",
        "kind": "parallel",
        "x": 1190,
        "y": 365,
        "size": 14
      },
      {
        "id": "wax-pool",
        "label": "Wax pool",
        "kind": "parallel",
        "x": 410,
        "y": 650,
        "size": 14
      },
      {
        "id": "target-oxygen",
        "label": "O₂ boundary target",
        "kind": "target",
        "x": 1040,
        "y": 255,
        "size": 13
      },
      {
        "id": "adjacent-ivm",
        "label": "Adjacent IVM address",
        "kind": "passage",
        "x": 1055,
        "y": 745,
        "size": 15
      }
    ],
    "edges": [
      {
        "source": "room-atmosphere",
        "target": "flame-envelope",
        "kind": "projection",
        "label": "oxygen · pressure · flow",
        "label_x": 670,
        "label_y": 275
      },
      {
        "source": "wick-fuel-interface",
        "target": "flame-envelope",
        "kind": "contribution",
        "label": "fuel vapor · heat feedback",
        "label_x": 655,
        "label_y": 612
      },
      {
        "source": "flame-envelope",
        "target": "exhaust-plume",
        "kind": "exchange",
        "label": "products · heat",
        "label_x": 1040,
        "label_y": 350
      },
      {
        "source": "wax-pool",
        "target": "wick-fuel-interface",
        "kind": "exchange",
        "label": "liquid fuel",
        "label_x": 605,
        "label_y": 675
      },
      {
        "source": "room-atmosphere",
        "target": "target-oxygen",
        "kind": "targeting",
        "label": "vary enclosing condition",
        "label_x": 960,
        "label_y": 175
      },
      {
        "source": "target-oxygen",
        "target": "flame-envelope",
        "kind": "targeting",
        "label": "predicted persistence change",
        "label_x": 980,
        "label_y": 320
      },
      {
        "source": "zero-infinity",
        "target": "adjacent-ivm",
        "kind": "ivm",
        "label": "Jitterbug passage · not observed",
        "label_x": 930,
        "label_y": 615
      }
    ],
    "ivm_cells": [
      {
        "id": "ivm-west",
        "cx": 430,
        "cy": 500,
        "radius": 128,
        "role": "parallel",
        "address": "parallel IVM field"
      },
      {
        "id": "ivm-northwest",
        "cx": 615,
        "cy": 180,
        "radius": 128,
        "role": "enclosing",
        "address": "enclosing IVM field A"
      },
      {
        "id": "ivm-northeast",
        "cx": 985,
        "cy": 180,
        "radius": 128,
        "role": "enclosing",
        "address": "enclosing IVM field B"
      },
      {
        "id": "ivm-current",
        "cx": 800,
        "cy": 500,
        "radius": 158,
        "role": "active",
        "address": "IVM:combustion:macroscopic:flame-envelope"
      },
      {
        "id": "ivm-east",
        "cx": 1170,
        "cy": 500,
        "radius": 128,
        "role": "parallel",
        "address": "parallel IVM field"
      },
      {
        "id": "ivm-southwest",
        "cx": 615,
        "cy": 820,
        "radius": 128,
        "role": "enclosed",
        "address": "enclosed IVM field A"
      },
      {
        "id": "ivm-southeast",
        "cx": 985,
        "cy": 820,
        "radius": 128,
        "role": "adjacent",
        "address": "IVM:combustion:extinguished-or-transformed-envelope"
      }
    ],
    "frontiers": {
      "outward": {
        "cx": 800,
        "cy": 500,
        "rx": 745,
        "ry": 480,
        "label_x": 1110,
        "label_y": 48,
        "label": "OUTWARD FINAL FRONTIER · BEYOND LARGEST MAPPED ENCLOSURE"
      },
      "inward": {
        "cx": 800,
        "cy": 500,
        "radius": 47,
        "label": "INWARD FINAL FRONTIER · BEYOND PLANCK-LENGTH ANCHOR",
        "label_x": 365,
        "label_y": 445
      },
      "temporal": {
        "path": "M620 585 A235 175 0 0 0 980 585",
        "begin_x": 620,
        "begin_y": 585,
        "end_x": 980,
        "end_y": 585,
        "label_x": 800,
        "label_y": 705,
        "label": "TEMPORAL ENCLOSURE · BEGINNING → COUNT → FINAL FRONTIER"
      }
    }
  },
  "volumes": {
    "registry_version": "0.1.0",
    "series": "Causality and Attraction: A Continuum of Steady States",
    "volumes": [
      {
        "volume": 1,
        "title": "Causality and Attraction: A Continuum of Steady States",
        "status": "source-located",
        "doi": "10.5281/zenodo.19468550",
        "primary_region": "The discovery field",
        "mapping_note": "Original observations of persistence, steady-state dynamic equilibria, nested enclosures, the Final Frontier, human systems, and the Great Attractor vector require page-level destination mapping."
      },
      {
        "volume": 2,
        "title": "The Climate Continuum",
        "status": "source-located",
        "doi": "10.5281/zenodo.21009123",
        "primary_region": "Living planetary enclosures",
        "mapping_note": "Climate, ecology, policy, dampening fields, and intervention destinations require page-level mapping."
      },
      {
        "volume": 3,
        "title": "The Antarctic Enclosure",
        "status": "source-located",
        "doi": "10.5281/zenodo.21009234",
        "primary_region": "Edges that act",
        "mapping_note": "Geography, ice, atmosphere, discovery, access, and the active edge of knowledge require page-level mapping."
      },
      {
        "volume": 4,
        "title": "Numbers and Enclosures",
        "status": "source-located",
        "doi": "10.5281/zenodo.21009393",
        "primary_region": "Geometry and notation",
        "mapping_note": "Enclosure Function, departure signs, Vector Equilibrium, Isotropic Vector Matrix, Zero Infinity, Final Frontier, and Departure Calculus require separate origin and maturity coordinates."
      },
      {
        "volume": 5,
        "title": "The Origin of Cosmology",
        "status": "source-located",
        "doi": "10.5281/zenodo.21010141",
        "primary_region": "Cosmological enclosure",
        "mapping_note": "Big Bang and Big Pull, top-down causal projection, bottom-up emergence, Great Attractors, origin models, and boundary-adjacent physics require page-level mapping."
      },
      {
        "volume": 6,
        "title": "Nested Causal Modelling",
        "status": "source-located",
        "doi": null,
        "primary_region": "The formal discipline",
        "mapping_note": "Canonical source is the corrected plain-language Volume VI. Superseded technical files must not be substituted for it."
      },
      {
        "volume": 7,
        "title": "A Continuum of Cognitive States",
        "status": "source-located",
        "doi": null,
        "primary_region": "The observing enclosure",
        "mapping_note": "Cognitive navigation, awareness, observation, and phenomenological proposals require claim-status mapping."
      },
      {
        "volume": 8,
        "title": "The Clock Is the Countably Infinite Scale to the Smooth Infinity of Time",
        "status": "provisional",
        "doi": null,
        "primary_region": "Temporal enclosure",
        "mapping_note": "Working manuscript maps event, clock, calendar, bounded count, phase, measured rate, and the bridge between countably infinite clocks and smooth time. It is the conceptual origin of the Nested Causality Atlas."
      },
      {
        "volume": 9,
        "title": null,
        "status": "unmapped",
        "doi": null,
        "primary_region": "Unlocated",
        "mapping_note": "A Rolling Stone research record exists, but the canonical volume title and manuscript must be established before mapping."
      },
      {
        "volume": 10,
        "title": "codeX: A Continuum of 630 Million Tokens",
        "status": "provisional",
        "doi": null,
        "primary_region": "Human-machine inquiry",
        "mapping_note": "Working manuscript maps the long-horizon Codex session, token as vessel, prior capture, compaction, and the attempt to preserve original thought."
      }
    ]
  }
};
