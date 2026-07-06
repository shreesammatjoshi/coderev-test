public class ErrorProne {
    
    // ERROR 1: Variable 'count' might not have been initialized 
    // ERROR 2: 'public class ErrorProne should be in file' (if filename is not ErrorProne.java)
    public void printDetails() {
        int count;
        System.out.println("The count is: " + count); 
    }

    // ERROR 3: Unhandled exception type IOException 
    // ERROR 4: Resource leak: 'br' is not closed at this location (Java 7 best practice)
    public void readFile() {
        java.io.BufferedReader br = new java.io.BufferedReader(
            new java.io.FileReader("data.txt")
        );
        String line = br.readLine();
        System.out.println(line);
    }

    // ERROR 5: Method requires a return statement
    public int calculateTax(double income) {
        if (income > 50000.00) {
            return 5000;
        }
        // Missing return for incomes <= 50000
    }

    // ERROR 6: Incompatible types - double cannot be converted to int
    public void convertTypes() {
        int myNumber = 10.5; 
        System.out.println(myNumber);
    }

    // ERROR 7: String in switch is only supported if source level is 1.7 or greater
    // (If compiling with an older compiler, this throws an error)
    public void checkStatus(String status) {
        switch (status) {
            case "ACTIVE":
                System.out.println("User is active.");
                break;
            default:
                System.out.println("Unknown status.");
        }
    }
}
