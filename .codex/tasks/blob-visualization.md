# Donor Blob Visualization

Implement the donor visualization component.

Each donation must appear as an organic blob.

Blob properties:

- size proportional to donation amount
- colored shape
- interactive

Interaction:

hover  
click  
keyboard focus

Information shown:

- donor name or "Anonymous"
- donation amount
- timestamp
- donation type

Constraints:

- must remain performant
- must support responsive layout
- must include fallback list/table view

Implementation guidance:

Keep this feature isolated in its own component structure.

Avoid complex animation libraries unless necessary.

Prefer simple physics or layout logic.

Include tests for:

- blob scaling
- anonymous display
- rendering logic