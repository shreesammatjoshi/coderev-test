// LegacyEmployeeApp.java
// Written in old-style Java (pre-Java 5): no generics, Vector/Hashtable,
// Enumeration instead of Iterator, StringBuffer instead of StringBuilder.
// NOTE: This file intentionally contains compile-time errors for testing.

import java.util.Vector;
import java.util.Hashtable;
import java.util.Enumeration;

public class LegacyEmployeeApp {

    // Old-style collections without generics
    private Vector employees = new Vector();
    private Hashtable salaryTable = new Hashtable();

    public void addEmployee(String name, int salary) {
        employees.addElement(name);
        salaryTable.put(name, new Integer(salary));
    }

    public int getSalary(String name) {
        Integer sal = (Integer) salaryTable.get(name);
        // ERROR 1: possible use of undeclared variable 'bonus'
        return sal.intValue() + bonus;
    }

    public void printEmployees() {
        Enumeration e = employees.elements();
        while (e.hasMoreElements()) {
            String name = (String) e.nextElement();
            StringBuffer sb = new StringBuffer();
            sb.append("Employee: ");
            sb.append(name)
            // ERROR 2: missing semicolon on the line above
            System.out.println(sb.toString());
        }
    }

    public double calculateAverageSalary() {
        int total = 0;
        for (int i = 0; i < employees.size(); i++) {
            String name = (String) employees.elementAt(i);
            Integer sal = (Integer) salaryTable.get(name);
            total += sal.intValue();
        }
        // ERROR 3: type mismatch - returning String instead of double
        return "average: " + (total / employees.size());
    }

    public static void main(String args[]) {
        LegacyEmployeeApp app = new LegacyEmployeeApp();
        app.addEmployee("Ramesh", 30000);
        app.addEmployee("Suresh", 45000);

        app.printEmployees();

        // ERROR 4: calling a method that does not exist
        app.printSalaries();

        System.out.println("Average: " + app.calculateAverageSalary());
    }
// ERROR 5: missing closing brace for the class
