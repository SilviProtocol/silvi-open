import csv
from rdflib import Graph, Literal, Namespace, URIRef
from rdflib.namespace import RDF, RDFS, XSD

def csv_to_rdf(csv_file, rdf_file, base_uri):
    # Create a new RDF graph
    g = Graph()

    # Define a custom namespace for our data
    DATA = Namespace(base_uri)

    # Read the CSV file
    with open(csv_file, 'r') as file:
        csv_reader = csv.DictReader(file)
        
        # Get the field names (column headers)
        fields = csv_reader.fieldnames

        # Process each row in the CSV
        for row_num, row in enumerate(csv_reader):
            # Create a unique subject for this row
            subject = URIRef(f"{base_uri}row/{row_num}")

            # Add a type for the row
            g.add((subject, RDF.type, DATA.Row))

            # Add triples for each column
            for field in fields:
                predicate = DATA[field.replace(' ', '_').lower()]
                obj = Literal(row[field])
                g.add((subject, predicate, obj))

    # Serialize the graph to a file
    g.serialize(destination=rdf_file, format='turtle')

# Example usage
csv_file = 'input.csv'
rdf_file = 'output.ttl'
base_uri = 'http://example.org/data/'

csv_to_rdf(csv_file, rdf_file, base_uri)
print(f"RDF data has been written to {rdf_file}")