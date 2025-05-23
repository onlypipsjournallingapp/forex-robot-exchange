
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [accountType, setAccountType] = useState("buyer");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if username is already taken
  const checkUsername = async (username: string) => {
    if (!username.trim()) {
      setUsernameError("");
      return;
    }
    
    setUsernameChecking(true);
    setUsernameError("");
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single();
      
      if (data) {
        setUsernameError("Username already taken");
      }
    } catch (error) {
      // If error is "No rows found" that means username is available, so no error
      // We only set error for other types of errors
      if (error.message !== "No rows found") {
        console.error("Error checking username:", error);
      }
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setUsernameError("");
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!username.trim()) {
      setUsernameError("Username is required");
      toast({
        title: "Username required",
        description: "Please provide a username.",
        variant: "destructive",
      });
      return;
    }

    // Final username check before submission
    setIsLoading(true);
    try {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .single();
      
      if (existingUser) {
        setUsernameError("Username already taken");
        toast({
          title: "Username already taken",
          description: "Please choose a different username.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Proceed with registration if username is available
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            account_type: accountType,
          }
        }
      });

      if (signUpError) throw signUpError;

      toast({
        title: "Registration successful!",
        description: "Your account has been created.",
      });

      navigate('/');
    } catch (error) {
      let errorMessage = "An unexpected error occurred.";
      
      if (error.message.includes("duplicate key") && error.message.includes("username")) {
        errorMessage = "Username already taken. Please choose a different username.";
        setUsernameError("Username already taken");
      } else {
        errorMessage = error.message;
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-1 container mx-auto flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>
              Enter your details to create your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    // Debounce username check to avoid too many requests
                    const timer = setTimeout(() => {
                      checkUsername(e.target.value);
                    }, 500);
                    return () => clearTimeout(timer);
                  }}
                  className={usernameError ? "border-red-500" : ""}
                  required
                />
                {usernameChecking && (
                  <p className="text-sm text-muted-foreground">Checking username...</p>
                )}
                {usernameError && (
                  <p className="text-sm text-red-500">{usernameError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <RadioGroup
                  value={accountType}
                  onValueChange={setAccountType}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="buyer" id="buyer" />
                    <Label htmlFor="buyer" className="cursor-pointer">
                      Buyer - I want to purchase forex robots
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="seller" id="seller" />
                    <Label htmlFor="seller" className="cursor-pointer">
                      Seller - I want to sell forex robots
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || usernameChecking || !!usernameError}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" type="button" disabled={isLoading}>
                  Google
                </Button>
                <Button variant="outline" type="button" disabled={isLoading}>
                  GitHub
                </Button>
              </div>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link to="/terms" className="hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              .
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
