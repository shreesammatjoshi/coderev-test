import java.util.Vector;
import java.util.Hashtable;
import java.util.Date;

public class DummyApp {

    private static Hashtable cache = new Hashtable(); // Raw type
    private Vector list = new Vector();               // Raw type

    public static void main(String args[]) {

        DummyApp app = new DummyApp();

        app.process(null);

        int result = app.divide(10, 0); // Division by zero
        System.out.println(result);

        if ("admin" == new String("admin")) { // Wrong string comparison
            System.out.println("Admin");
        }

        Date date = new Date(124, 0, 1); // Deprecated constructor

        System.out.println(date);

        Thread t = new Thread(new Runnable() {
            public void run() {
                while (true) {
                    // Infinite busy loop
                }
            }
        });

        t.start();

        String password = "SuperSecret123"; // Hardcoded secret

        System.out.println(password);

        app.unusedMethod();

        Integer num = null;
        System.out.println(num.intValue()); // NullPointerException

        System.exit(0);
    }

    public void process(String input) {

        if (input.equals("hello")) { // Possible NullPointerException
            System.out.println("Hello");
        }

        for (int i = 0; i < 1000000; i++) {
            cache.put(i, i);
        }

        try {
            int x = Integer.parseInt("abc");
        } catch (Exception e) {
            // Swallowed exception
        }

    }

    public int divide(int a, int b) {
        return a / b;
    }

    private void unusedMethod() {
        int unused = 10;
        unused++;
    }

}
