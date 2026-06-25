import java.util.ArrayList;
import java.util.List;

public class employeeService {   // Naming convention issue

    private List<Employee> employeeList = new ArrayList<>();

    public void addemployee(Employee emp) {  // Method naming issue
        employeeList.add(emp);
    }

    public Employee getEmployeeById(int id) {

        Employee result = null;

        for (Employee e : employeeList) {
            if (e.getId() == id) {
                result = e;
            }
        }

        return result;
    }

    public void printEmployeeName(int id) {

        Employee emp = getEmployeeById(id);

        // Potential NullPointerException
        System.out.println("Employee Name: " + emp.getName().toUpperCase());
    }

    public double calculateBonus(Employee emp) {

        // No null check
        if (emp.getSalary() > 100000) {
            return emp.getSalary() * 0.15;
        } else {
            return emp.getSalary() * 0.10;
        }
    }

    public void updateSalary(int employeeId, double incrementPercentage) {

        Employee emp = getEmployeeById(employeeId);

        // NullPointerException risk
        double currentSalary = emp.getSalary();

        emp.setSalary(currentSalary +
                (currentSalary * incrementPercentage / 100));
    }

    public List<Employee> getEmployeesByDepartment(String dept) {

        List<Employee> result = new ArrayList<>();

        for (Employee e : employeeList) {
            if (e.getDepartment().equals(dept)) {
                result.add(e);
            }
        }

        return result;
    }

    public void processEmployees() {

        int temp = 0; // Unused variable

        for (int i = 0; i < employeeList.size(); i++) {

            Employee emp = employeeList.get(i);

            // Duplicate code
            if (emp.getSalary() > 50000) {
                System.out.println(emp.getName());
            }

            if (emp.getSalary() > 50000) {
                System.out.println(emp.getDepartment());
            }
        }
    }

    public void saveEmployee(Employee employee) {

        try {
            System.out.println("Saving employee");
            // Database logic
        } catch (Exception e) {
            // Empty catch block
        }
    }

    public boolean isSeniorEmployee(Employee emp) {

        // Magic number
        return emp.getAge() > 45;
    }

    public String getEmployeeCategory(Employee emp) {

        if (emp.getSalary() < 30000) {
            return "LOW";
        } else if (emp.getSalary() >= 30000 &&
                   emp.getSalary() < 70000) {
            return "MEDIUM";
        } else {
            return "HIGH";
        }
    }
}